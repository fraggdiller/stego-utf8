import { Position, StegoUTF8 } from './stego';
import * as fs from 'node:fs';

/**
 * @typedef {object} Args - Интерфейс аргументов командной строки.
 * @property {boolean} encode - Флаг кодирования.
 * @property {boolean} decode - Флаг декодирования.
 * @property {boolean} clean - Флаг очистки.
 * @property {string} [toHide] - Строка для скрытия.
 * @property {string} [fileSource] - Путь к файлу.
 * @property {string} [clearSource] - Исходная строка для кодирования.
 * @property {string} [outputPath] - Путь для сохранения результата.
 * @property {Position} [position=Position.NTHLINES] - Позиция встраивания.
 * @property {number} [k=1] - Количество встраиваний.
 */
interface Args {
    encode: boolean;
    decode: boolean;
    clean: boolean;
    toHide?: string;
    fileSource?: string;
    clearSource?: string;
    outputPath?: string;
    position?: Position;
    k?: number;
    [key: string]: boolean | string | number | Position | undefined;
}

/**
 * Проверяет переданные аргументы на валидность.
 * @param {Args} args - Проверяемые аргументы.
 * @returns {boolean} - Результат проверки.
 */
function checkArgs (args: Args): boolean {
    if (args.clearSource && args.fileSource) {
        console.log('Invalid options. Pass either a string source or a file source.');
        return false;
    }

    if ([args.encode, args.decode, args.clean].filter(Boolean).length !== 1) {
        console.log('Invalid options. Pass either encode, decode, or clean.');
        return false;
    }

    if (!args.clearSource && !args.fileSource && args.encode) {
        console.log('Invalid options. Pass one source.');
        return false;
    }

    if (!args.toHide && args.encode) {
        console.log('Invalid options. Pass a string to hide.');
        return false;
    }

    if (args.encode) {
        args.position = args.position || Position.NTHLINES;

        if (isNaN(args.position)) {
            console.log('Invalid position.');
            return false;
        }

        args.k = parseInt(args.k as never);
        if (isNaN(args.k)) {
            console.log('Invalid k.');
            return false;
        }
    }

    return true;
}

/**
 * Очищает скрытые данные из строки или файла.
 * @param {Args} args - Аргументы командной строки.
 * @returns {void}
 */
function clean (args: Args): void {
    const stego: StegoUTF8 = new StegoUTF8();

    let cleaned: string;
    if (args.fileSource) {
        cleaned = stego.cleanFile(args.fileSource);
    } else {
        cleaned = stego.cleanString(args.clearSource as string);
    }

    if (args.outputPath) {
        fs.writeFileSync(args.outputPath, cleaned);
    } else {
        console.log(cleaned);
    }
}

/**
 * Кодирует данные и встраивает их в строку или файл.
 * @param {Args} args - Аргументы командной строки.
 * @returns {void}
 */
function encode (args: Args): void {
    const stego: StegoUTF8 = new StegoUTF8();
    const clear: string = args.toHide || '';

    let encoded: string;
    if (args.fileSource) {
        encoded = stego.zeroEncodeFile(
            args.fileSource,
            clear,
            args.position as Position,
            args.k || 1
        );
    } else {
        encoded = stego.zeroEncode(
            clear,
            args.clearSource || '',
            args.position as Position,
            args.k || 1
        );
    }

    if (args.outputPath) {
        fs.writeFileSync(args.outputPath, encoded);
    } else {
        console.log(encoded);
    }
}

/**
 * Декодирует данные из строки или файла.
 * @param {Args} args - Аргументы командной строки.
 * @returns {void}
 */
function decode (args: Args): void {
    const stego: StegoUTF8 = new StegoUTF8();

    let decoded: string;
    if (args.fileSource) {
        decoded = stego.zeroDecodeFile(args.fileSource);
    } else {
        decoded = stego.zeroDecode(args.clearSource || '');
    }

    if (args.outputPath) {
        fs.writeFileSync(args.outputPath, decoded);
    } else {
        console.log(decoded);
    }
}

/**
 * Главная функция, обрабатывает аргументы командной строки и запускает соответствующую обработку.
 * @returns {void}
 */
function main (): void {
    const args: Args = {
        version: false,
        encode: false,
        decode: false,
        clean: false,
        position: Position.NTHLINES,
        k: 1,
    };

    const actions: Record<string, (i: number) => void> = {
        '-V': () => (args.version = true),
        '--version': () => (args.version = true),
        '-E': () => (args.encode = true),
        '--encode': () => (args.encode = true),
        '-D': () => (args.decode = true),
        '--decode': () => (args.decode = true),
        '-C': () => (args.clean = true),
        '--clean': () => (args.clean = true),
        '-t': (i) => (args.toHide = process.argv[i + 1]),
        '--to-hide': (i) => (args.toHide = process.argv[i + 1]),
        '-f': (i) => (args.fileSource = process.argv[i + 1]),
        '--file-source': (i) => (args.fileSource = process.argv[i + 1]),
        '-c': (i) => (args.clearSource = process.argv[i + 1]),
        '--clear-source': (i) => (args.clearSource = process.argv[i + 1]),
        '-o': (i) => (args.outputPath = process.argv[i + 1]),
        '--output-path': (i) => (args.outputPath = process.argv[i + 1]),
        '-p': (i) => (args.position = parseInt(process.argv[i + 1])),
        '--position': (i) => (args.position = parseInt(process.argv[i + 1])),
        '-k': (i) => (args.k = parseInt(process.argv[i + 1])),
        '--position-k': (i) => (args.k = parseInt(process.argv[i + 1])),
    };

    for (let i = 0; i < process.argv.length; i++) {
        const arg: string = process.argv[i];
        const action = actions[arg];
        if (action) {
            action(i);
        }
    }

    if (!checkArgs(args)) {
        return;
    }

    const operations: Record<string, () => void> = {
        clean: () => clean(args),
        encode: () => encode(args),
        decode: () => decode(args),
    };

    const selectedOperation = Object.keys(operations).find((op) => args[op as keyof Args]);

    if (selectedOperation) {
        operations[selectedOperation]();
    }
}

main();
