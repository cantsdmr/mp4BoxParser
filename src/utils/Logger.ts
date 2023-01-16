export class Logger {
    public static log(input: any) {
        console.log(`${new Date().toISOString()}  ${input}`)
    }
}