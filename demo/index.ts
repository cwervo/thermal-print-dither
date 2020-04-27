import { reset, setCharacterStyle, printImage } from "../driver"
import { canvasDraw } from "./canvas_draw"
import * as floydSteinberg from "floyd-steinberg"
// import PB from 'https://unpkg.com/printerboi@0.1.1/index.js'

const canvas = document.querySelector("canvas") as HTMLCanvasElement
canvasDraw(canvas)
const ctx = canvas.getContext("2d")!
const mvEl;

function setAttributeBlank(el, attribute) {
    el.setAttribute(attribute, '')
}

function setupModelViewer(src) {
    mvEl = document.createElement('model-viewer')
    mvEl.setAttribute('src', src)
    // mvEl.setAttribute('background-color', '#FFFFFF')
    setAttributeBlank(mvEl, 'auto-rotate')
    // mvEl.setAttribute('camera-orbit', '-45deg 55deg 2.5m')
    // setAttributeBlank(mvEl, 'camera-controls')
    document.body.appendChild(mvEl)
}

function drawImageOnContext(image, context, ratio=1.0) {
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth * ratio, image.naturalHeight * ratio) // double tall
}

function drawDitheredImage() {
    const ditheredImage = document.querySelector('img')

    // TODO: for model-viewer implementation
    // const ditheredModelViewerSrc = mvEl.shadowRoot.querySelector('canvas').toDataURL()
    // const newImage = document.createElement('img')
    // // newImage.setAttribute('src', ditheredModelViewerSrc)
    // newImage.setAttribute('src', ditheredImage)
    // document.body.appendChild(newImage)

    // drawImageOnContext(ditheredImage, ctx, 1.5)
    drawImageOnContext(newImage, ctx, 1.0)
    let ditherImage = floydSteinberg(ctx.getImageData(0, 0, canvas.width, canvas.height))
    // console.log(ditherImage.data.filter(n => n !== 0))
    ctx.putImageData(ditherImage, 0, 0)
}

// setupModelViewer('./models/gameboy.glb')

// I have NO IDEA why, but without `window.d =` this fails to draw ...
// must be some canvas context race condition ... or TS access issue to the DOM?!
window.d = drawDitheredImage

document.querySelector("#auth")!.addEventListener("click", e => {  navigator.usb
        .requestDevice({
            filters: []
        })
        .then(async device => {
            (window as any)["device"] = device
            await claimInterface(device)
        })
})

async function claimInterface(device: USBDevice) {
    for (const config of device.configurations) {
        for (const iface of config.interfaces) {
            if (!iface.claimed) {
                await device.claimInterface(iface.interfaceNumber)
                return true
            }
        }
    }

    return false
}

(async () => {
    const devices = await navigator.usb.getDevices()
    if (devices.length) {
        if (devices[0].opened === false) {
            await devices[0].open()
        }

        const d = devices[0]

        await claimInterface(d)
        await reset(d)
        await setCharacterStyle(d, {
            smallFont: false,
            emphasized: false,
            underline: false,
            doubleWidth: false,
            doubleHeight: false
        })

        document.querySelector("#print")!.addEventListener("click", async e => {
            const imageData: number[][] = []
            const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            console.log("D", canvasData)

            for (let y = 0 y < canvas.height y++) {
                imageData.push([])
                for (let x = 0 x < canvas.width x++) {
                    const idx = y * (canvas.width * 4) + x * 4
                    const r =  canvasData.data[idx]
                    const g =  canvasData.data[idx + 1]
                    const b =  canvasData.data[idx + 2]
                    const alpha = canvasData.data[idx + 3]
                    imageData[y][x] = alpha !== 0 && (r < 255 || g < 255 || b < 255) ? 1 : 0
                }
            }

            await printImage(d, imageData, 24)
        })
    }
})()
