/*
 * Copyright 2021 Google Inc. All Rights Reserved.
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

/**
 * Query for WebXR support. If there's no support for the `immersive-ar` mode,
 * show an error.
 */
(async function() {
  const isArSessionSupported =
      navigator.xr &&
      navigator.xr.isSessionSupported &&
      await navigator.xr.isSessionSupported("immersive-ar");
  if (isArSessionSupported) {
    document.getElementById("enter-ar").addEventListener("click", window.app.activateXR)

  } else {
    onNoXRDevice();
  }
})();

/**
 * Container class to manage connecting to the WebXR Device API
 * and handle rendering on every frame.
 */

class App {
  /**
   * Run when the Start AR button is pressed.
   */
  activateXR = async () => {
    try {
      /** Initialize a WebXR session using "immersive-ar". */
      /** Alternatively, initialize a WebXR session using extra required features. */
       this.xrSession = await navigator.xr.requestSession("immersive-ar", { 
         requiredFeatures: ['hit-test', 'dom-overlay'],
         domOverlay: { root: document.body }
       });

      /** Create the canvas that will contain our camera's background and our virtual scene. */
      this.createXRCanvas();

      /** With everything set up, start the app. */
      await this.onSessionStarted();
    } catch(e) {
      console.log(e);
      onNoXRDevice();
    }
  }

  /**
   * Add a canvas element and initialize a WebGL context that is compatible with WebXR.
   */
  createXRCanvas() {
    this.canvas = document.createElement("canvas");
    document.body.appendChild(this.canvas);
    this.gl = this.canvas.getContext("webgl", {xrCompatible: true});

    this.xrSession.updateRenderState({
      baseLayer: new XRWebGLLayer(this.xrSession, this.gl)
    });
  }

  /**
   * Called when the XRSession has begun. Here we set up our three.js
   * renderer, scene, and camera and attach our XRWebGLLayer to the
   * XRSession and kick off the render loop.
   */
  onSessionStarted = async () => {
    /** Add the `ar` class to our body, which will hide our 2D components. */
    document.body.classList.add('ar');

    /** To help with working with 3D on the web, we'll use three.js. */
    this.setupThreeJs();

    /** Setup an XRReferenceSpace using the "local" coordinate system. */
    this.localReferenceSpace = await this.xrSession.requestReferenceSpace('local');

    /** Create another XRReferenceSpace that has the viewer as the origin. */
    this.viewerSpace = await this.xrSession.requestReferenceSpace('viewer'); 

    /** Perform hit testing using the viewer as origin. */
    this.hitTestSource = await this.xrSession.requestHitTestSource({
        space: this.viewerSpace
    }); //마커 

    /** Start a rendering loop using this.onXRFrame. */
    this.xrSession.requestAnimationFrame(this.onXRFrame);

    var setObjectButton = document.getElementById("setObject");
    setObjectButton.addEventListener("click", this.deleteClone);
    setObjectButton.addEventListener("click", this.onSelect);

    var sizePlus = document.getElementById("sizePlus");
    sizePlus.addEventListener("click", this.sizePlus);

    var sizeDiscount = document.getElementById("sizeDiscount");
    sizeDiscount.addEventListener("click", this.sizeDiscount);
    // this.xrSession.addEventListener("select", this.deleteClone);
    // this.xrSession.addEventListener("select", this.onSelect);
  }

  /**
   * Called on the XRSession's requestAnimationFrame.
   * Called with the time and XRPresentationFrame.
   */
  onXRFrame = (time, frame) => {
    //console.log("onXRFrame");
    /** Queue up the next draw request. */
     this.xrSession.requestAnimationFrame(this.onXRFrame);

    /** Bind the graphics framebuffer to the baseLayer's framebuffer. */
     const framebuffer = this.xrSession.renderState.baseLayer.framebuffer
     this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer) 
     this.renderer.setFramebuffer(framebuffer);
    /** Retrieve the pose of the device.
     * XRFrame.getViewerPose can return null while the session attempts to establish tracking. */
     const pose = frame.getViewerPose(this.localReferenceSpace);
     if (pose) { //주석풀기
       /** In mobile AR, we only have one view. */
       const view = pose.views[0];
    //
       const viewport = this.xrSession.renderState.baseLayer.getViewport(view);
       this.renderer.setSize(viewport.width, viewport.height)
    //
       /** Use the view's transform matrix and projection matrix to configure the THREE.camera. */
       this.camera.matrix.fromArray(view.transform.matrix)
       this.camera.projectionMatrix.fromArray(view.projectionMatrix);
       this.camera.updateMatrixWorld(true);
    //
    //   /** Conduct hit test. */
       const hitTestResults = frame.getHitTestResults(this.hitTestSource);
       /** If we have results, consider the environment stabilized. */
       if (!this.stabilized && hitTestResults.length > 0) {
         this.stabilized = true;
         document.body.classList.add('stabilized');
       }
       if (hitTestResults.length > 0) {
         const hitPose = hitTestResults[0].getPose(this.localReferenceSpace); 
    //
    //     /** Update the reticle position. */
         this.reticle.visible = true;
         this.reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z)
         this.reticle.updateMatrixWorld(true);
       }
       /** Render the scene with THREE.WebGLRenderer. */
       var delta = this.clock.getDelta();
       
       console.log("mixer : " + this.mixer);
      //  if (  this.mixer )  this.mixer.update( delta );
      if (  window.mixer )  window.mixer.update( delta );

       this.renderer.render(this.scene, this.camera)
     }
  }

  /**
   * Initialize three.js specific rendering code, including a WebGLRenderer,
   * a demo scene, and a camera for viewing the 3D content.
   */
  setupThreeJs() {
    /** To help with working with 3D on the web, we'll use three.js.
     * Set up the WebGLRenderer, which handles rendering to our session's base layer. */
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: this.canvas,
      context: this.gl
    });
    this.renderer.autoClear = false;
     this.renderer.shadowMap.enabled = true;
     this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    /** Initialize our demo scene. */
     this.scene = DemoUtils.createLitScene(); //마커 
     
     this.reticle = new Reticle(); ///마커
     this.scene.add(this.reticle); //마커
     
     //ggongjukim
     this.clock =  new THREE.Clock();


    /** We'll update the camera matrices directly from API, so
     * disable matrix auto updates so three.js doesn't attempt
     * to handle the matrices independently. */
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;
  }

  /** Place a sunflower when the screen is tapped. */
   onSelect = () => {
     if (window.heritage) 
     {
      //  const clone = window.heritage.clone();
      //  this.mixer = new THREE.AnimationMixer(clone);
      //  if (window.aniclip) this.mixer.clipAction(window.aniclip).play();
      //  clone.position.copy(this.reticle.position);
      //  console.log("position: " + clone.position.x + "/" + clone.position.y + "/" + clone.position.z);

      //  this.clones = clone;
      //  var boundingbox = new THREE.BoxHelper(clone, 0xffff00);
      //  this.scene.add(boundingbox);
      //  this.scene.add(clone);

      //0103
      console.log("onselect");
      this.cl = new CL();
      this.scene.add(this.cl);
      this.cl.position.copy(this.reticle.position);

      //사이즈 조절 frustum
      const frustum = new THREE.Frustum()
      const matrix = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
      frustum.setFromProjectionMatrix(matrix)

      var minPoint = new THREE.Vector3(window.boundingBoxThree.min.x, window.boundingBoxThree.min.y, window.boundingBoxThree.min.z);
      var maxPoint = new THREE.Vector3(window.boundingBoxThree.max.x, window.boundingBoxThree.max.y, window.boundingBoxThree.max.z);

      if (frustum.containsPoint(minPoint)&&frustum.containsPoint(maxPoint)) {
        console.log('in of view')
      }else{
        console.log('out of view')
        this.cl.scale.multiplyScalar(0.2);

      }

      // var setmodelsize = function(){
      //   if (!frustum.containsPoint(minPoint)) {
      //     console.log('out of view')
      //     cl.scale.multiplyScalar(0.2);
      //     setmodelsize();

      //   }
      // }
      // setmodelsize();

      // while (true) {
      //   if (!frustum.containsPoint(minPoint)) {
      //     console.log('out of view')
      //     // this.cl.scale.multiplyScalar(0.9);
      //     setTimeout(() => this.cl.scale.multiplyScalar(0.9), 3000);
      //   }else{
      //     break;
      //   }
      // }


      //  setInterval(function () {
      //   this.setgltfSize(minPoint);
      //  }, 2000);


     }
   } 

  deleteClone = () => {
    console.log("deleteclone");
    if (this.cl) this.scene.remove(this.cl);
  }

  sizePlus = () => {
    this.cl.scale.multiplyScalar(1.1);
  }

  sizeDiscount = () => {
    this.cl.scale.multiplyScalar(0.9);
  }
}

window.app = new App();
