import { Box, BoxType } from "./Box";

export default class BoxParser {
    private rawData: Uint8Array = null as any
    private printConsoleLog: boolean = false
    private boxes: Box[] = []
    private mdatBox: Box = null as any
    private parserPosition: number = 0
    private utf8Decoder = new TextDecoder()
    private BOX_SIZE_BYTE = 4
    private BOX_TYPE_BYTE = 4
    private _loggerFn: (input: any) => void

    constructor(logger?: Function) {
        this._loggerFn = (...args) => {
            if (!this.printConsoleLog) {
                return this;
            }

            logger ? logger(args) : console.log(args)

            return this
        }
    }

    public setRawData(value: Uint8Array) {
        this.rawData = value;

        return this
    }

    public setConsoleLog(value: boolean): this {
        this.printConsoleLog = value === true
        return this
    }

    public readData() {
        this.parseBoxes()

        return this
    }

    public getReporting() {
        return {
            boxes: this.boxes,
            xmlContent: this.mdatBox ? this.mdatBox.content : null
        }
    }

    private parseBoxes() {
        if (this.rawData == null || this.rawData.length === 0) return

        while (this.parserPosition < this.rawData.length) {
            this.processBoxes()
        }
    }

    private processSingleBox(box: Box, startOffset: number) {
        // Box size metadata info
        const sizeView = new DataView(this.rawData.buffer, startOffset, this.BOX_SIZE_BYTE);
        box.size = sizeView.getUint32(0, false);
        box.startingByteOffset = startOffset
        box.endByteOffset = box.startingByteOffset + box.size

        // Box type metadata info
        const typeView = new DataView(this.rawData.buffer, startOffset + this.BOX_SIZE_BYTE, this.BOX_SIZE_BYTE);
        const type = this.utf8Decoder.decode(typeView).toUpperCase() as keyof typeof BoxType
        box.type = BoxType[type]

        this._loggerFn(`Found a box of type ${type}. Size is ${box.size} Byte.`)
    }

    private processBoxes(startOffset = this.parserPosition, box = new Box()) {
        if (startOffset === this.rawData.length) {
            return
        }

        this.processSingleBox(box, startOffset)

        const dataPosition = box.startingByteOffset + this.BOX_SIZE_BYTE + this.BOX_TYPE_BYTE
        let childBox;

        if (box.type === BoxType.MOOF || box.type === BoxType.TRAF) {
            this.parserPosition = dataPosition

            while (this.parserPosition < box.endByteOffset) {
                childBox = new Box(true)
                box.childBoxes.push(childBox)
                this.processBoxes(this.parserPosition, childBox)
            }

        } else {
            if (box.type === BoxType.MDAT) {
                const dataLength = box.size - (this.BOX_SIZE_BYTE + this.BOX_TYPE_BYTE)
                const dataView = new DataView(this.rawData.buffer, dataPosition, dataLength);
                box.content = this.utf8Decoder.decode(dataView)
                this.mdatBox = box
                this._loggerFn(`Content of ${BoxType.MDAT} is as follows: ${box.content}`)
            }

            this.parserPosition += box.size
        }

        if (!box.isChild) {
            this.boxes.push(box)
        }
    }
}