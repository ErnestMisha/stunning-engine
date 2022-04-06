import { XMLProcessor } from './XMLProcessor';

const processor = new XMLProcessor(process.argv[2], process.argv[3]);
processor.processFile().catch(err => {
    console.error(err);
    process.exit(1);
});
