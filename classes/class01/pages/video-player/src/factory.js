import Controller from "./controller.js"
import View from "./view.js"

import Camera from "../../../lib/shared/camera.js"
import { supportWorkerType } from "../../../lib/shared/util.js"
import Service from "./service.js"

async function getWorker() {
    if (supportWorkerType()) {
        console.log("initializing esm workers!")
        const worker = new Worker("./src/worker.js", { type: "module" })
        return worker
    }

    console.warn("Your browser doens't support esm modules on webworkers!")
    console.warn("Importing libraries...")

    await import ("https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js")
    await import ("https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js")
    await import ("https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js")
    await import ("https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js")

    console.warn("using worker mock instead!")

    const service = new Service({
        faceLandmarksDetection: window.faceLandmarksDetection
    })

    const workerMock = {
        async postMessage(video) {
            const blinked = await service.handleBlinked(video)
            if (!blinked) return
            workerMock.onmessage({ data: { blinked }})
        },
        // vai ser sobreescrito pela controller
        onmessage(msg) {}
    }

    console.log("loading tf model.")
    await service.loadModel()
    console.log("tf model loaded!")

    setTimeout(() => {
        worker.onmessage({ data: "READY!" })
    }, 1000)

    return workerMock
}

const worker = await getWorker()

const [rootPath] = window.location.href.split('/pages/')

const camera = await Camera.init()

const factory = {
    async initalize() {
        return Controller.initialize({
            view: new View(),
            camera,
            worker
        })
    }
}

export default factory