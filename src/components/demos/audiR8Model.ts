import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { IndustryModel } from "./industryModels";

const MODEL_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/models/audi-r8-spyder.glb`;

function triangleCount(group: THREE.Group): number {
  let triangles = 0;
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const index = mesh.geometry.getIndex();
    triangles += index ? index.count / 3 : mesh.geometry.getAttribute("position").count / 3;
  });
  return Math.round(triangles);
}

/** Blenderで制作したR8 Spyder専用GLBを、既存ビューア用のモデルへ変換する。 */
export async function loadAudiR8Model(themedMaterial: THREE.Material): Promise<IndustryModel> {
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
  const group = gltf.scene;
  group.name = "Audi R8 Spyder — Blender GLB";

  const themed: THREE.Mesh[] = [];
  const replacedMaterials = new Set<THREE.Material>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.some((material) => material.name === "BodyPaint")) {
      materials.forEach((material) => replacedMaterials.add(material));
      mesh.material = themedMaterial;
      themed.push(mesh);
    }
  });
  replacedMaterials.forEach((material) => material.dispose());

  // Blenderでは実寸メートルで制作。ビューアのカメラに収まるよう僅かに縮小し、接地させる。
  group.scale.setScalar(1.28);
  group.rotation.y = -Math.PI / 5;
  const bounds = new THREE.Box3().setFromObject(group);
  group.position.y -= bounds.min.y + 1.34;

  return {
    group,
    themed,
    triangles: triangleCount(group),
    dispose: () => {
      const materials = new Set<THREE.Material>();
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        meshMaterials.forEach((material) => {
          if (material !== themedMaterial) materials.add(material);
        });
      });
      materials.forEach((material) => material.dispose());
    },
  };
}
