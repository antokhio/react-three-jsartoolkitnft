import type { Camera, Group, Matrix4, WebGLRenderer } from 'three';

const isMobile = () => /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);

const setMatrix = (matrix: Matrix4, value: Record<number, number>) => {
    const array: number[] = [];
    for (const key in value) {
        array[key] = value[key];
    }
    //@ts-ignore
    if (typeof matrix.elements.set === 'function') {
        //@ts-ignore
        matrix.elements.set(array);
    } else {
        //@ts-ignore
        matrix.elements = [].slice.call(array);
    }
};

export class ARNFT {
    canvasContext: CanvasRenderingContext2D;
    canvasProcess: HTMLCanvasElement;
    worker: Worker;
    // Video transfer
    processArgs: {
        pw: number;
        ph: number;
        video: HTMLVideoElement;
        vw: number;
        vh: number;
        ox: number;
        oy: number;
        w: number;
        h: number;
    } | null = null;

    // THREE
    camera!: Camera;
    far!: number;
    near!: number;
    onInitializedCallback!: () => void;
    onLoadedCallback!: () => void;

    // Markers
    ids: number[];
    groups: Group[];
    persisted: boolean[];
    infos: { id: number; width: number; height: number; dpi: number }[];
    constructor() {
        // Initialize worker
        // const worker = new Worker(new URL('./workers/arnft.worker.ts', import.meta.url), {
        //     type: 'module',
        // }) as Worker;

        const url = new URL('./workers/arnft.worker.ts', import.meta.url);
        const getWorker = () => new Worker(url, { type: 'module' });
        const worker = getWorker() as Worker;

        worker.onmessage = (args) => this.onMessage(args);
        worker.onerror = (e) => console.error(e);
        this.worker = worker;

        // Initialize offscreen canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvasProcess = canvas;
        this.canvasContext = context;

        // Init buffer
        this.ids = [];
        this.groups = [];
        this.infos = [];
        this.persisted = [];
    }
    // called onloadedmetadata
    initialize(
        args: {
            video: HTMLVideoElement;
            camera: Camera;
            camera_para: string;
            vw: number;
            vh: number;
            near?: number;
            far?: number;
        },
        onInitialized: () => void
    ) {
        const { video, camera, camera_para, vw, vh, far = 100000.0, near = 10.0 } = args;
        const pscale = 320 / Math.max(vw, (vh / 3) * 4);
        const sscale = isMobile() ? window.outerWidth / vw : 1;

        const sw = vw * sscale;
        const sh = vh * sscale;

        const w = vw * pscale;
        const h = vh * pscale;

        const pw = Math.max(w, (h / 3) * 4);
        const ph = Math.max(h, (w / 4) * 3);

        const ox = (pw - w) / 2;
        const oy = (ph - h) / 2;

        //@ts-expect-error
        this.canvasProcess.style.clientWidth = pw + 'px';
        //@ts-expect-error
        this.canvasProcess.style.clientHeight = ph + 'px';
        this.canvasProcess.width = pw;
        this.canvasProcess.height = ph;

        this.camera = camera;
        this.far = far;
        this.near = near;

        this.processArgs = {
            pw,
            ph,
            video,
            vw,
            vh,
            ox,
            oy,
            w,
            h,
        };

        this.onInitializedCallback = () => onInitialized();
        this.message('initialize', { pw, ph, camera_para });
    }
    load(markers: { urls: string[]; root: Group; persisted: boolean }[], onLoaded: () => void) {
        console.log('Loading markers...');
        const args = [];
        for (let i = 0; i < markers.length; i++) {
            for (let j = 0; j < markers[i].urls.length; j++) {
                args.push({ id: i, marker: markers[i].urls[j] });
            }
            this.groups.push(markers[i].root);
            this.persisted.push(markers[i].persisted);
        }

        this.ids = args.map(({ id }) => id);
        this.onLoadedCallback = () => onLoaded();
        this.message(
            'load',
            args.map(({ marker }) => marker)
        );
    }

    process() {
        if (this.processArgs) {
            const { pw, ph, video, vw, vh, ox, oy, w, h } = this.processArgs;
            this.canvasContext.fillStyle = 'black';
            this.canvasContext.fillRect(0, 0, pw, ph);
            this.canvasContext.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

            const imagedata = this.canvasContext.getImageData(0, 0, pw, ph);
            this.worker.postMessage({ type: 'process', imagedata }, [imagedata.data.buffer]);
        }
    }
    onMessage(e: MessageEvent<any>) {
        const { type, payload } = e.data;
        switch (type) {
            case 'log':
                console.log(payload);
                break;
            case 'initialized': {
                console.log('Initialized');
                this.onInitilized(payload);
                break;
            }
            case 'loaded': {
                console.log('Loaded markers');
                this.onLoaded(payload);
                break;
            }
            case 'found': {
                this.onFound(payload);
                break;
            }
            case 'lost': {
                this.onLost();
                break;
            }
        }
    }
    onFound({ index, matrixGL_RH }: any) {
        // Set group center to marker center
        this.groups[this.ids[index]].children[0].position.x =
            ((this.infos[index].width / this.infos[index].dpi) * 2.54 * 10) / 2.0;
        this.groups[this.ids[index]].children[0].position.y =
            ((this.infos[index].height / this.infos[index].dpi) * 2.54 * 10) / 2.0;
        // Set marker transform
        setMatrix(this.groups[this.ids[index]].matrix, matrixGL_RH);
        // Set visibility
        this.groups[this.ids[index]].visible = true;
    }
    onLost() {
        for (let i = 0; i < this.groups.length; i++) {
            // if not pesisted collapse visibility
            if (!this.persisted[i]) this.groups[i].visible = false;
        }
    }
    onLoaded(payload: { id: number; width: number; height: number; dpi: number }[]) {
        console.log('Markers loaded', payload);
        this.infos = payload;
        console.log('Starting process()');
        this.onLoadedCallback();
    }
    onInitilized(payload: string) {
        const { pw, ph, w, h } = this.processArgs!;
        const proj = JSON.parse(payload) as Float64Array;
        const ratioW = pw / w;
        const ratioH = ph / h;
        proj[0] *= ratioW;
        proj[4] *= ratioW;
        proj[8] *= ratioW;
        proj[12] *= ratioW;
        proj[1] *= ratioH;
        proj[5] *= ratioH;
        proj[9] *= ratioH;
        proj[13] *= ratioH;

        const f = 100000.0;
        const n = 10;
        proj[10] = -(f / (f - n));
        proj[14] = -((f * n) / (f - n));

        setMatrix(this.camera.projectionMatrix, proj);

        this.camera.matrixAutoUpdate = false;

        this.onInitializedCallback();
    }
    message(type: string, payload: any) {
        this.worker.postMessage({ type, payload });
    }
}
