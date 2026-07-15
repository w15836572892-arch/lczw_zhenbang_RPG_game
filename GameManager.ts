/**
 * GameManager —— 游戏总控制脚本
 * 
 * 挂载在游戏场景的全局节点上，负责：
 * - 游戏初始化与数据校验
 * - 驱动核心玩法测试流程（模拟玩家操作）
 * 
 * 通过 PlayerData 单例读写墨料、背包与错题本数据。
 */

 import { _decorator, Component, CCInteger, CCBoolean } from 'cc';
import PlayerData from './PlayerData';
import { BagUI } from './BagUI'; // 🌟 导入背包 UI 组件（命名导入）

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    // ========================== @property 属性区 ==========================

    /**
     * 每次探索/答题消耗的墨料数量
     */
    @property({ type: CCInteger, displayName: '探索消耗墨料', tooltip: '每次进行甲骨文探索或答题时消耗的墨料数量' })
    public exploreCost: number = 20;

    /**
     * 调试开关：启动时自动运行 simulateGameLoop 并刷新背包 UI
     */
    
    @property({ type: CCBoolean, displayName: '调试模拟模式', tooltip: '开启后 start 时自动运行 simulateGameLoop 并刷新背包 UI' })
    
    public debugSimulate: boolean = true;

    /**
     * start —— 组件启动时自动调用
     *
     * 在这里完成游戏初始化工作：
     * 1. 打印当前初始墨料和背包状态
     * 2. 等待真实的场景交互驱动游戏流程
     */
    @property({ type: BagUI, displayName: '背包界面组件' })
    public bagUI: BagUI = null;


    // ========================== 生命周期方法 ==========================

    public start(): void {
        console.log('========== 游戏初始化开始 ==========');

        const playerData = PlayerData.getInstance();

        console.log(`[GameManager] 初始墨料: ${playerData.inkCount}`);
        if (playerData.bagCards.length === 0) {
            console.log('[GameManager] 初始背包: 空');
        } else {
            console.log(`[GameManager] 初始背包: ${playerData.bagCards.join(', ')}`);
        }
        console.log(`[GameManager] 初始错题本长度: ${playerData.errorBook.size}`);
        console.log('====================================\n');

        // 调试模式：自动运行模拟流程并刷新背包 UI（发布时关闭 debugSimulate 即可）
        if (this.debugSimulate) {
            this.simulateGameLoop();

            if (this.bagUI) {
                this.bagUI.refresh();
            } else {
                console.warn("老弟，记得把 BagPanel 节点拖进 GameManager 的 bagUI 槽位里！");
            }
        }
    }


    /**
     * simulateGameLoop —— 模拟核心玩法流程
     */
    public simulateGameLoop(): void {
        console.log('<><><><><> 核心玩法模拟测试开始 <><><><><>\n');

        // ----------------------------------------
        // 步骤 A: 消耗墨料
        // ----------------------------------------
        console.log('-------- 步骤 A: 探索甲骨文 / 答题 --------');
        const playerDataBeforeA = PlayerData.getInstance();
        console.log(`[GameManager] 当前墨料: ${playerDataBeforeA.inkCount}`);
        playerDataBeforeA.addInk(-this.exploreCost);
        console.log(`[GameManager] 探索完毕，剩余墨料: ${playerDataBeforeA.inkCount}\n`);

        // ----------------------------------------
        // 步骤 B: 占卜获得【日】并放入背包
        // ----------------------------------------
        console.log('-------- 步骤 B: 占卜/答对，获取卡片 --------');
        const playerDataAfterB = PlayerData.getInstance();
        console.log(`[GameManager] 获得了甲骨文文字【日】`);
        playerDataAfterB.addCardToBag('日');
        console.log(`[GameManager] 背包：${playerDataAfterB.bagCards.join(', ')}\n`);

        // ----------------------------------------
        // 步骤 C: 模拟答错记入错题本
        // ----------------------------------------
        console.log('-------- 步骤 C: 遭遇挑战，记入错题 --------');
        const playerDataBeforeC = PlayerData.getInstance();
        playerDataBeforeC.addInk(-this.exploreCost);
        playerDataBeforeC.recordError('月');
        console.log(`[GameManager] 答错啦，将【月】记当当前...`);
        console.log(`[GameManager] 发现了【月】的出错次数: ${playerDataBeforeC.errorBook.get('月')}\n`);

        // ----------------------------------------
        // 最终控制台输出
        // ----------------------------------------
        console.log('========== 模拟运行结束，最终游戏状态 ==========');
        const finalData = PlayerData.getInstance();
        console.log(`[GameManager] 最终墨料: ${finalData.inkCount}`);
        console.log(`[GameManager] 最终背包: ${finalData.bagCards.join(', ')}`);
        console.log(`[GameManager] 错题本记录数: ${finalData.errorBook.size}`);
        console.log('================================================\n');
    }
}
