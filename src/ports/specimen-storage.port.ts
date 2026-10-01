import { LifeSpecimen } from '../core/models';

export interface SpecimenStoragePort {
  getAll(): LifeSpecimen[];
  save(specimen: LifeSpecimen): void;
  /**
   * 移除指定标本。
   * @returns 是否成功移除（id 不存在或持久化失败时返回 false）。
   * 持久化层异常时也可能直接抛出，调用方需捕获并回滚内存状态。
   */
  remove(id: string): boolean;
  clear(): void;
}
