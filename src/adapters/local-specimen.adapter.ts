import { LifeSpecimen } from '../core/models';
import { SpecimenStoragePort } from '../ports/specimen-storage.port';

const SPECIMEN_STORAGE_KEY = 'parallel_life_specimens_v1';

export class LocalSpecimenAdapter implements SpecimenStoragePort {
  // 内存缓存：渲染读取与删除回滚都以它为准，写操作成功后再落盘
  private cache: LifeSpecimen[] | null = null;

  getAll(): LifeSpecimen[] {
    if (this.cache) return this.cache;

    const raw = localStorage.getItem(SPECIMEN_STORAGE_KEY);
    if (!raw) {
      this.cache = [];
      return this.cache;
    }
    try {
      const parsed = JSON.parse(raw);
      this.cache = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  save(specimen: LifeSpecimen): void {
    const list = [...this.getAll()];
    const existingIdx = list.findIndex(s => s.id === specimen.id);
    if (existingIdx >= 0) {
      list[existingIdx] = specimen;
    } else {
      list.unshift(specimen);
    }
    this.persist(list); // 持久化成功后才更新内存缓存
  }

  remove(id: string): boolean {
    const previous = [...this.getAll()];
    const next = previous.filter(s => s.id !== id);
    if (next.length === previous.length) {
      return false; // 目标标本不存在
    }
    // persist 抛错时内存缓存保持原状（previous），调用方可据此回滚 UI
    this.persist(next);
    return true;
  }

  clear(): void {
    this.persist([]);
  }

  private persist(list: LifeSpecimen[]): void {
    localStorage.setItem(SPECIMEN_STORAGE_KEY, JSON.stringify(list));
    this.cache = list;
  }
}
