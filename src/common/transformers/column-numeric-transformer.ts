// @ref: https://github.com/typeorm/typeorm/issues/873
// not being used anymore
export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}
