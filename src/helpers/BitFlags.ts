export class BitFlags<Options> {
  flags: Map<Options, number>;
  reverse: boolean;

  static toBitFlag(values: boolean[], reverseLogic = false): number {
    const bitFlag = values
      .map((value) => (reverseLogic ? +!value : +value))
      .reverse()
      .join('');

    return parseInt(bitFlag, 2);
  }

  constructor(options: Array<Options>, reverse = false) {
    this.reverse = reverse;
    this.flags = options.reduce((memo, value, i) => {
      memo.set(value, 1 << i);
      return memo;
    }, new Map());
  }

  has(checkFlag: Options, value: number): boolean {
    if (!this.flags.has(checkFlag)) {
      throw new Error('Incorrect option provided');
    }

    const result = (value & (this.flags.get(checkFlag) as number)) === this.flags.get(checkFlag);
    return this.reverse ? !result : result;
  }
}
