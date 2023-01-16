export enum BoxType {
    MOOF = 'moof',
    MDAT = 'mdat',
    MFHD = 'mfhd',
    TRAF = 'traf',
    TFHD = 'tfhd',
    TRUN = 'trun',
    UUID = 'uuid'
}

export class Box {
    public size: number = 0
    public startingByteOffset = 0
    public endByteOffset = 0
    public dataByte: ArrayBuffer | null = null
    public type: BoxType | null = null
    public content: string | null = null
    public childBoxes: Box[] = []
    public isChild: boolean = false

    constructor(isChild = false) {
        this.isChild = isChild
    }
}