import { reset, setCharacterStyle, printImage } from "../driver";
import { canvasDraw } from "./canvas_draw";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
canvasDraw(canvas);
const ctx = canvas.getContext("2d")!;

console.log("hello, from TS!")

function drawDitheredImage() {
    // const ditheredImagePath = "./Michelangelo's_David_-_Bayer.png";
    // const ditheredImage = document.createElement("img");
    // ditheredImage.src = ditheredImagePath;
    const ditheredImage = document.querySelector('img');
    // ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 180, 215);
    // ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 360, 215); // double wide
    ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 180, 430); // double tall
    // ctx.drawImage(ditheredImage, 0, 0, 180, 215, 0, 0, 180, 860); // double tall

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
