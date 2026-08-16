/** Clone a GLTF scene so SkinnedMesh bones stay bound (avoids a CDN import that can hang loading). */
export function cloneGltfScene(source) {
  const sourceLookup = new Map();
  const cloneLookup = new Map();
  const cloned = source.clone(true);

  const walk = (a, b) => {
    sourceLookup.set(b, a);
    cloneLookup.set(a, b);
    for (let i = 0; i < a.children.length; i++) walk(a.children[i], b.children[i]);
  };
  walk(source, cloned);

  cloned.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    const src = sourceLookup.get(node);
    if (!src?.skeleton) return;
    node.skeleton = src.skeleton.clone();
    node.bindMatrix.copy(src.bindMatrix);
    node.skeleton.bones = src.skeleton.bones.map((bone) => cloneLookup.get(bone) || bone);
    node.bind(node.skeleton, node.bindMatrix);
    node.frustumCulled = false;
  });

  return cloned;
}
