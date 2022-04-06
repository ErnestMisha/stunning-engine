import { createReadStream, createWriteStream, WriteStream } from 'fs';
import { createInterface, Interface } from 'readline';

export class XMLProcessor {

    private output: WriteStream;
    private rl: Interface;

    constructor(inputPath: string, outputPath: string) {
        this.output = createWriteStream(outputPath, 'utf8');
        this.rl = createInterface({
            input: createReadStream(inputPath, 'utf8')
        });
    }

    async processFile() {
        let offerTag = false;
        let timesTag = false;
        let active = false;
        let activeAmount = 0;
        let pausedAmount = 0;
        for await(const line of this.rl) {
            if(line.includes('<offer>')) {
                offerTag = true;
            }
            else if(line.includes('</offer>')) {
                offerTag = false;
            }
            if(offerTag && line.includes('<opening_times>') && line.includes('</opening_times>')) {
                timesTag = true;
                const days = this.getObject(line);
                active = this.isActive(days);
                if(active) {
                    ++activeAmount;
                }
                else {
                    ++pausedAmount;
                }
            }
            this.output.write(line + '\n');
            if(timesTag) {
                this.output.write(`\t<is_active><![CDATA[${active}]]></is_active>\n`);
                timesTag = false;
            }
        }
        console.log(`Active offers: ${activeAmount}`);
        console.log(`Paused offers: ${pausedAmount}`);
    }

    private getObject(line: string) {
        const tagEnd = ']]></opening_times>';
        const days = line.slice(25, line.indexOf(tagEnd));
        return JSON.parse(days);
    }

    private isActive(days: any) {
        const now = new Date();
        let day = now.getUTCDay();
        day = (day == 0) ? 7 : day;
        if(!days[day]?.length) {
            return false;
        }
        const [openHour, openMinute] = days[day][0]?.opening.split(':');
        const [closeHour, closeMinute] = days[day][0]?.closing.split(':');
        const openTime = new Date();
        const closeTime = new Date();
        openTime.setUTCHours(openHour, openMinute);
        closeTime.setUTCHours(closeHour, closeMinute);
        if((closeTime > openTime && now > openTime && now < closeTime) || (openTime > closeTime && now > openTime)) {
            return true;
        }
        return false;
    }
}
