import JSAR from '@webarkit/jsartoolkit-nft'
import type ARControllerNFT from '@webarkit/jsartoolkit-nft/types/src/ARControllerNFT'

const self = globalThis as unknown as DedicatedWorkerGlobalScope

const log = (payload: string) => self.postMessage({ type: 'log', payload })
const message = (type: string, payload: any) => self.postMessage({ type, payload })

let controller: ARControllerNFT | null = null

type GetNftMarkerData = {
    index: number;
    type: number;
    marker: {
        id: number;
        error: number;
        found: boolean;
        pose: number[];
    };
    matrix: Float64Array;
    matrixGL_RH: Float64Array;
}

type GetNftMarkerEventArgs = {
    name: 'getNFTMarker';
    data: GetNftMarkerData;
    target: any;
}
let currentMarker: GetNftMarkerData | null = null

const initialize = async ({ pw, ph, camera_para }: { pw: number; ph: number; camera_para: string }) => {
    message('log', 'Initializing...')
    controller = await JSAR.ARControllerNFT.initWithDimensions(pw, ph, camera_para)
    controller.addEventListener('getNFTMarker', (ev: GetNftMarkerEventArgs) => {
        currentMarker = ev.data
    })

    message('initialized', JSON.stringify(controller.getCameraMatrix()))
}

const load = async (markers: string[]) => {
    await controller?.loadNFTMarkers(
        markers,
        (ids: unknown) => {
            const loadedMarkers = (ids as number[]).map((i) => {
                controller?.trackNFTMarkerId(i)
                // Seems args are (cameraId, markerId)
                return controller?.getNFTData(0, i)
            })
            message('loaded', loadedMarkers)
        },
        () => message('log', 'Error during load markers.')
    )
}
const process = (data: any) => {
    //// @ts-expect-error
    controller?.process(data.imagedata)

    if (currentMarker) {
        message('found', {
            index: currentMarker.index,
            matrixGL_RH: currentMarker.matrixGL_RH,
        })
        currentMarker = null
    } else {
        message('lost', null)
    }
}
self.onmessage = (e: MessageEvent<any>) => {
    const { type, payload } = e.data
    switch (type) {
        case 'initialize':
            initialize(payload)
            return
        case 'process':
            process(e.data)
            return
        case 'load':
            load(payload)
            return
        default:
            return
    }
}

self.onerror = (e: ErrorEvent) => {}

export default self
