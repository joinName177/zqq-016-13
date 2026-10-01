import './ui/styles.css';
import { TreeEngineAdapter } from './adapters/tree-engine.adapter';
import { LocalSpecimenAdapter } from './adapters/local-specimen.adapter';
import { CounterfactualTree, LifeSpecimen } from './core/models';
import { renderTreeApp, TreeUIHandlers } from './ui/app';

const treeAdapter = new TreeEngineAdapter();
const specimenAdapter = new LocalSpecimenAdapter();

const PRESETS = [
  '如果当初我留在了故乡小城',
  '如果当初我鼓起勇气向TA表白了心意',
  '如果当年我选择了读纯艺术专业',
  '如果当年我没有接受那家大厂的Offer'
];

let currentTree: CounterfactualTree = treeAdapter.createTree(PRESETS[0]);
let isCabinetOpen = false;
let specimenFilter = '';

const rootEl = document.getElementById('app')!;

// 依据存储层当前状态完整重渲染，保证数量、筛选结果、空状态始终同源同步
function render() {
  const specimens = specimenAdapter.getAll();
  renderTreeApp(rootEl, currentTree, specimens, isCabinetOpen, PRESETS, handlers, specimenFilter);
}

const handlers: TreeUIHandlers = {
  onGrowNewTree: (assumption: string) => {
    currentTree = treeAdapter.createTree(assumption);
    render();
  },
  onWaterNode: (nodeId: string) => {
    currentTree = treeAdapter.water(currentTree, nodeId);
    render();
  },
  onPruneNode: (nodeId: string) => {
    currentTree = treeAdapter.prune(currentTree, nodeId);
    render();
  },
  onHarvestNode: (nodeId: string) => {
    const sp = treeAdapter.harvest(currentTree, nodeId);
    specimenAdapter.save(sp);
    alert(`已成功将节点【${sp.title}】收入平行人生标本馆！`);
    render();
  },
  onDeleteSpecimen: (id: string) => {
    const previous: LifeSpecimen[] = specimenAdapter.getAll();
    const remaining = previous.filter(s => s.id !== id);
    if (remaining.length === previous.length) return; // 标本已不存在，无需处理

    // 乐观更新：立即移除并重绘，使数量统计、筛选结果与空状态同步刷新
    renderWith(remaining);

    const rollback = (message: string) => {
      // 持久化失败：恢复删除前的完整列表，数量、筛选、空状态一并还原
      renderWith(previous);
      alert(message);
    };

    try {
      const removed = specimenAdapter.remove(id);
      if (!removed) {
        rollback('删除失败：标本仍在标本馆中，列表已恢复。');
      }
    } catch (err) {
      console.error('[specimen] remove failed, rolled back:', err);
      rollback('删除失败：无法写入本地存储，列表已恢复。');
    }
  },
  onFilterSpecimens: (keyword: string) => {
    specimenFilter = keyword;
    render();
  },
  onToggleCabinet: (open: boolean) => {
    isCabinetOpen = open;
    if (open) specimenFilter = ''; // 每次打开标本馆重置筛选
    render();
  }
};

// 用指定的标本列表渲染（乐观更新/回滚用），不改动存储层
function renderWith(specimens: LifeSpecimen[]) {
  renderTreeApp(rootEl, currentTree, specimens, isCabinetOpen, PRESETS, handlers, specimenFilter);
}

// Initial render
render();
