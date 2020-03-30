import { reset, setCharacterStyle, printImage } from "../driver";
import { canvasDraw } from "./canvas_draw";
import * as floydSteinberg from "floyd-steinberg";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
canvasDraw(canvas);
const ctx = canvas.getContext("2d")!;

console.log("👋🏼");

function drawImageOnContext(image, context, ratio=1.0) {
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth * ratio, image.naturalHeight * ratio); // double tall
}

function drawDitheredImage() {
    // const ditheredImagePath = "./Michelangelo's_David_-_Bayer.png";
    // const ditheredImage = document.createElement("img");
    // ditheredImage.src = ditheredImagePath;
    const ditheredImage = document.querySelector('img');

    // ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 180, 215);
    // ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 360, 215); // double wide
    // ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 180, 430); // double tall

    drawImageOnContext(ditheredImage, ctx, 1.5)
    let ditherImage = floydSteinberg(ctx.getImageData(0, 0, canvas.width, canvas.height));
    console.log(ditherImage);
    ctx.putImageData(ditherImage, 0, 0);

    // ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 180, 860); // double tall

    // draw firework 1:1
    // ctx.drawImage(ditheredImage, 0, 0, 225, 225, 0, 0, 180, 215);
    // draw portrait from Unsplash
    // TODO: A function that reads in the pixel size, & allows you to downsize by specifying a percentage 0.0-1.0 (1.0 by default)
    // ctx.drawImage(ditheredImage, 0, 0, 320, 480, 0, 0, 320, 480); // portrait, original size
    // ctx.drawImage(ditheredImage, 0, 0, 320, 480, 0, 0, 320, 480); // * 0.5, prints completely black!
    // ctx.drawImage(ditheredImage, 0, 0, 320, 480, 0, 0, 480, 720); // * 1.5
    // Exposed portrait:
    // ctx.drawImage(ditheredImage, 0, 0, 232, 348, 0, 0, 464, 696); // * 1.5
}
// I have NO IDEA why, but without `window.d =` this fails to draw ...
// must be some canvas context race condition ... or TS access issue to the DOM?!
window.d = drawDitheredImage()

document.querySelector("#auth")!.addEventListener("click", e => {  navigator.usb
        .requestDevice({
            filters: []
        })
        .then(async device => {
            (window as any)["device"] = device;
            await claimInterface(device);
        });
});

async function claimInterface(device: USBDevice) {
    for (const config of device.configurations) {
        for (const iface of config.interfaces) {
            if (!iface.claimed) {
                await device.claimInterface(iface.interfaceNumber);
                return true;
            }
        }
    }

    return false;
}

(async () => {
    const devices = await navigator.usb.getDevices();
    if (devices.length) {
        if (devices[0].opened === false) {
            await devices[0].open();
        }

        const d = devices[0];

        await claimInterface(d);
        await reset(d);
        await setCharacterStyle(d, {
            smallFont: false,
            emphasized: false,
            underline: false,
            doubleWidth: false,
            doubleHeight: false
        });

        document.querySelector("#print")!.addEventListener("click", async e => {
            const imageData: number[][] = [];
            const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < canvas.height; y++) {
                imageData.push([]);
                for (let x = 0; x < canvas.width; x++) {
                    const idx = y * (canvas.width * 4) + x * 4
                    const r =  canvasData.data[idx];
                    const g =  canvasData.data[idx + 1];
                    const b =  canvasData.data[idx + 2];
                    const alpha = canvasData.data[idx + 3];
                    imageData[y][x] = alpha !== 0 && (r < 255 || g < 255 || b < 255) ? 1 : 0;
                }
            }

            await printImage(d, imageData, 24);
        });
    }
})();
