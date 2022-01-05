/*
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

window.gltfLoader = new THREE.GLTFLoader();
/**
 * The Reticle class creates an object that repeatedly calls
 * `xrSession.requestHitTest()` to render a ring along a found
 * horizontal surface.
 */
class Reticle extends THREE.Object3D {//십자 모형 클래스 ->
  constructor() {
    super();

    this.loader = new THREE.GLTFLoader();
//    this.loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf", (gltf) => {
//    this.loader.load("../assets/map_pointer/scene.gltf", (gltf) => {
    this.loader.load("../assets/glbreticle.glb", (gltf) => {
      
      // var mixer = new THREE.AnimationMixer( gltf.scene );
      // var action = mixer.clipAction( gltf.animations[ 0 ] );
      // action.play();

      this.add(gltf.scene);

    })

    this.visible = false;
  }
}
//../assets/glbreticle.glb

// window.gltfLoader.load("https://immersive-web.github.io/webxr-samples/media/gltf/sunflower/sunflower.gltf", function(gltf) {
//  const flower = gltf.scene.children.find(c => c.name === 'sunflower')
//  flower.castShadow = true;
//  window.sunflower = gltf.scene;
// });

//../assets/Cheonlock_CL/Cheonlock_CL.gltf
//Cheonlock_CR
//../assets/cheonlock_cr_edited_sketchfab/scene.gltf
window.gltfLoader.load("../assets/brushmodel/brush.gltf", function(gltf) {
  const heritage = gltf.scene.children.find(c => c.name === 'heritage')
  //heritage.castShadow = true;
  //gltf.scene.scale.set(0.05, 0.05, 0.05);
  //gltf.scene.updateMatrixWorld(true);

  window.heritage = gltf.scene;
  if(gltf.animations[ 0 ]) window.aniclip = gltf.animations[ 0 ];
  // var mixer = new THREE.AnimationMixer(window.heritage);
  // mixer.clipAction( gltf.animations[ 0 ] ).play();

  // var action = mixer.clipAction(window.heritage.animations[0]);
  // action.play();
  //window.heritage = gltf.scene;
});
//../assets/cheonlock_cr_edited_sketchfab/scene.gltf
//../assets/Cheonlock_CL/Cheonlock_CL.gltf
//../assets/bee-gltf/source/bee_gltf.gltf
//../assets/cheonlock_cr_edited_sketchfab/scene.gltf
//../assets/brushmodel/brush.gltf
//../assets/bee-gltf/source/bee_gltf.gltf
//../assets/brushmodel/brush.gltf
//../assets/brushmodel/brush.gltf
//../assets/bee-gltf/source/bee_gltf.gltf
//../assets/bee-gltf/source/bee_gltf.gltf
//../assets/phoenix_bird/scene.gltf
//../assets/phoenix_bird/scene.gltf
class CL extends THREE.Object3D {//십자 모형 클래스 ->
  constructor() {
    super();

    this.loader = new THREE.GLTFLoader();
    this.loader.load("../assets/bee-gltf/source/bee_gltf.gltf", (gltf) => {
      if(gltf.animations[0]){
        window.mixer = new THREE.AnimationMixer(gltf.scene);
        var action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
      // //test용 
      // var geometry = new THREE.BoxGeometry( 10, 30, 20 );
      // var material = new THREE.MeshLambertMaterial( { color: 0x4eb8fb } );
      // var cube = new THREE.Mesh( geometry, material );
      // this.add(cube);


      var boundingBoxHelper = new THREE.BoxHelper( gltf.scene, 0xffff00 );//BoxHelper
      window.boundingBoxThree = new THREE.Box3().setFromObject(gltf.scene);
      // var material = new THREE.MeshLambertMaterial({ color: 0x4eb8fb });
      // var cube = new THREE.Mesh( window.boundingBoxThree, material);
      // window.boxmin = window.boundingboxSetFromObject.min();
      
      // window.boxmax = window.boundingboxSetFromObject.max;
      this.add(boundingBoxHelper);
      this.add(gltf.scene);

    })
    //this.visible = false;
  }
}

window.DemoUtils = {
  /**
   * Creates a THREE.Scene containing lights that case shadows,
   * and a mesh that will receive shadows.
   *
   * @return {THREE.Scene}
   */
  createLitScene() {
    const scene = new THREE.Scene();

    // The materials will render as a black mesh
    // without lights in our scenes. Let's add an ambient light
    // so our material can be visible, as well as a directional light
    // for the shadow.
    const light = new THREE.AmbientLight(0xffffff, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 15, 10);

    // We want this light to cast shadow.
    directionalLight.castShadow = true;

    // Make a large plane to receive our shadows
    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    // Rotate our plane to be parallel to the floor
    planeGeometry.rotateX(-Math.PI / 2);

    // Create a mesh with a shadow material, resulting in a mesh
    // that only renders shadows once we flip the `receiveShadow` property.
    const shadowMesh = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({
      color: 0x111111,
      opacity: 0.2,
    }));



    // Give it a name so we can reference it later, and set `receiveShadow`
    // to true so that it can render our model's shadow.
    shadowMesh.name = 'shadowMesh';
    shadowMesh.receiveShadow = true;
    shadowMesh.position.y = 10000;

    // Add lights and shadow material to scene.
    scene.add(shadowMesh);
    scene.add(light);
    scene.add(directionalLight);

    return scene;
  },

};

/**
 * Toggle on a class on the page to disable the "Enter AR"
 * button and display the unsupported browser message.
 */
function onNoXRDevice() {
  document.body.classList.add('unsupported');
}