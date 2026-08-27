<?php
/**
 * お問い合わせの送信受け口（さくらのレンタルサーバ用）。
 *
 * このサイトは Next.js の静的書き出し（output: "export"）なので Server Actions が使えない。
 * さくらは PHP が動くので、out/ と一緒にこの1ファイルを置き、フォームから fetch で POST する。
 * 外部のフォームサービスを使わないため、お客様の入力内容が第三者を経由しない。
 *
 * 送信されるもの
 *   1. 管理者宛の通知メール（Reply-To に送信者のアドレスが入るので、そのまま返信できる）
 *   2. 送信者宛の自動返信メール
 *
 * ■ 事前準備（さくらのコントロールパネル）
 *   MAIL_FROM のメールアドレスを実際に作成しておくこと。
 *   差出人が自ドメインでないと、なりすまし判定で迷惑メールに入る（SPF）。
 *
 * ■ 注意
 *   - このファイルは public/ にあるので out/ へそのままコピーされる。
 *   - .htaccess の RewriteRule は実ファイルをそのまま通すので、追加設定は不要。
 *   - PHP はソースが配信されないため、ここに書いた宛先アドレスは公開されない。
 */

declare(strict_types=1);

/* ── 設定 ───────────────────────────────────────────────── */

/** 通知の宛先（担当者） */
const ADMIN_TO = 'yasufumi2707@icloud.com';
/** 差出人。**さくらで実在するアドレスにすること**（SPF・迷惑メール対策） */
const MAIL_FROM = 'no-reply@yebisusoft.jp';
const SITE_NAME = 'エビスソフト';
const SITE_URL = 'https://www.yebisusoft.jp';
/** 自動返信の署名に載せる電話番号。PHP からは src/lib/site.ts を読めないので二重管理になる。
 *  site.ts の telephoneDisplay を変えたら、ここも直すこと。 */
const SITE_TEL = '090-8208-7295';

/** このホスト以外からの送信は受け付けない（他サイトに埋め込まれた偽フォーム対策） */
// www なしでアクセスされた場合と、移行確認中の旧ドメインも当面は許可する。
// 旧ドメインを閉鎖したら 'ebisusoft.sakura.ne.jp' の行を消すこと。
const ALLOWED_HOSTS = ['www.yebisusoft.jp', 'yebisusoft.jp', 'ebisusoft.sakura.ne.jp'];

/** フォーム表示から送信までの最短秒数。これより速い＝自動入力とみなす */
const MIN_ELAPSED_SECONDS = 3;
/** 同一IPからの連続送信の間隔（秒） */
const RATE_LIMIT_SECONDS = 30;

/** 各項目の最大文字数（これを超えたら切り詰める。DoS と巨大メール防止） */
const MAX_LEN_SHORT = 200;
const MAX_LEN_BODY = 8000;

/* ── ユーティリティ ──────────────────────────────────────── */

/** JSON を返して終了する */
function respond(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * メールヘッダーに入れる値を無害化する。
 * 改行を残すと「To: ... \r\n Bcc: 攻撃者」のようにヘッダーを追加され、
 * 迷惑メールの踏み台にされる（ヘッダーインジェクション）。
 */
function headerSafe(string $value, int $maxLen = MAX_LEN_SHORT): string
{
    $value = str_replace(["\r", "\n", "\0", "%0a", "%0d"], '', $value);
    return mb_substr(trim($value), 0, $maxLen);
}

/** 本文用。改行は残すが、制御文字と長すぎる入力は落とす */
function bodySafe(string $value, int $maxLen = MAX_LEN_BODY): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $value) ?? '';
    return mb_substr(trim($value), 0, $maxLen);
}

/* ── 受け付けの前提チェック ─────────────────────────────── */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

// 送信元のホストを確認する。Origin が無いブラウザのために Referer も見る。
$origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if ($origin !== '') {
    $host = parse_url($origin, PHP_URL_HOST) ?: '';
    if (!in_array($host, ALLOWED_HOSTS, true)) {
        respond(403, ['ok' => false, 'error' => 'forbidden_origin']);
    }
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 64 * 1024) {
    respond(413, ['ok' => false, 'error' => 'payload_too_large']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'error' => 'invalid_json']);
}

$get = static fn(string $key): string => is_string($data[$key] ?? null) ? $data[$key] : '';

/* ── スパム判定 ─────────────────────────────────────────── */

// ハニーポット。人には見えない項目なので、埋まっていればボット。
// 攻撃者に検知させないため、成功したように見せて何も送らない。
if ($get('company_url') !== '') {
    respond(200, ['ok' => true]);
}

// フォーム表示から送信までが速すぎる場合も自動入力とみなす
$elapsed = (int) ($data['elapsed'] ?? 0);
if ($elapsed > 0 && $elapsed < MIN_ELAPSED_SECONDS) {
    respond(200, ['ok' => true]);
}

// 同一IPからの連投を弾く（一時ファイルの更新時刻だけで判定する簡易版）
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if ($ip !== '') {
    $lockFile = sys_get_temp_dir() . '/ebisusoft-contact-' . sha1($ip);
    if (is_file($lockFile) && (time() - (int) filemtime($lockFile)) < RATE_LIMIT_SECONDS) {
        respond(429, ['ok' => false, 'error' => 'too_many_requests']);
    }
    @touch($lockFile);
}

/* ── 入力の検証 ─────────────────────────────────────────── */

mb_internal_encoding('UTF-8');

$name = headerSafe($get('name'));
$email = headerSafe($get('email'));
$company = headerSafe($get('company'));
$goal = bodySafe($get('goal'));
$body = bodySafe($get('body'));

$errors = [];
if ($name === '') {
    $errors['name'] = 'お名前を入力してください。';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'メールアドレスの形式が正しくありません。';
}
if ($goal === '') {
    $errors['goal'] = 'やりたいことを入力してください。';
}
if ($body === '') {
    // フォーム側で組み立てた本文。空なら壊れたリクエスト
    $errors['body'] = '送信内容を取得できませんでした。';
}

if ($errors !== []) {
    respond(422, ['ok' => false, 'error' => 'validation_failed', 'errors' => $errors]);
}

/* ── メール送信 ─────────────────────────────────────────── */

mb_language('Japanese');

$who = $company !== '' ? $company : $name;
$received = date('Y-m-d H:i:s');
// heredoc は定数を展開しないので、いったん変数に移す
$siteName = SITE_NAME;
$siteUrl = SITE_URL;

// 1. 管理者宛の通知
$adminSubject = '【サイトからのご相談】' . $who . ' 様';
$adminBody = <<<TEXT
サイトのお問い合わせフォームから、ご相談が届きました。
このメールにそのまま返信すると、お客様へ返信できます。

受信日時：{$received}
--------------------------------------------------

{$body}

--------------------------------------------------
{$siteName} {$siteUrl}
TEXT;

$adminHeaders = implode("\r\n", [
    'From: ' . mb_encode_mimeheader(SITE_NAME) . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . mb_encode_mimeheader($name) . ' <' . $email . '>',
]);

$adminSent = mb_send_mail(ADMIN_TO, $adminSubject, $adminBody, $adminHeaders, '-f' . MAIL_FROM);

if (!$adminSent) {
    error_log('[contact.php] admin mail failed: ' . $email);
    respond(500, ['ok' => false, 'error' => 'send_failed']);
}

// 2. 送信者への自動返信（失敗しても受付自体は成立しているので成功を返す）
$replySubject = 'お問い合わせありがとうございます｜' . SITE_NAME;
$replyBody = <<<TEXT
{$name} 様

お問い合わせいただきありがとうございます。
下記の内容で承りました。2営業日以内に担当者よりご返信いたします。

※ このメールは自動送信です。ご返信いただいてもお答えできません。
　 お急ぎの場合は下記の連絡先までお願いいたします。

--------------------------------------------------

{$body}

--------------------------------------------------
TEXT;
$replyBody .= "\n" . SITE_NAME . "\n" . SITE_URL . "\n電話：" . SITE_TEL . "\n";

$replyHeaders = 'From: ' . mb_encode_mimeheader(SITE_NAME) . ' <' . MAIL_FROM . '>';

if (!mb_send_mail($email, $replySubject, $replyBody, $replyHeaders, '-f' . MAIL_FROM)) {
    error_log('[contact.php] auto-reply failed: ' . $email);
}

respond(200, ['ok' => true]);
