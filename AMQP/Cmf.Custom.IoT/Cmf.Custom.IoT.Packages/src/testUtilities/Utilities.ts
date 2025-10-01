export class TestUtilities {
    public static async waitForNoError(timeout: number, errorMessage: string, callback: any): Promise<void> {
        while (true) {
            try {
                await callback();
                return;
            }
            catch (err) {
                // Intentionally Left Blank
            }
            if (timeout <= 0)
                {throw Error(errorMessage);}

            timeout -= 100;
            await this.sleep(100);
        }
    }

    public static async waitFor(timeout: number, errorMessage: string, callback: any): Promise<void> {
        while (true) {
            if (callback())
                {return;}

            if (timeout <= 0)
                {throw Error(errorMessage);}

            timeout -= 100;
            await this.sleep(100);
        }
    }

    public static async waitForever() {
        while (true) {
            await this.sleep(1000);
        }
    }

    public static async sleep(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static round(value: number, decimal: number): number {
        const multiplier = Math.pow(10, decimal);
        return Math.round(value * multiplier) / multiplier;
    }
}
