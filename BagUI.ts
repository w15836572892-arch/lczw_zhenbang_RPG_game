/**
 * BagUI —— 背包主界面控制器
 *
 * 挂载在背包 UI 的根节点上，负责：
 * - 根据 PlayerData 中的背包字符串列表，匹配完整卡牌数据
 * - 通过 ScrollView 动态生成 CardItem 实例
 * - 提供图鉴学习 / 占卜答题两种模式的切换
 * - 将模式变更同步下发给所有卡牌子项
 */

import { _decorator, Component, Node, Label, Prefab, ScrollView, instantiate, Layout } from 'cc';
import { BagMode, CardQuality, CardItem, ICardData } from './CardItem';
import PlayerData from './PlayerData';

const { ccclass, property } = _decorator;

// ======================== 示例卡牌完整数据源 ========================

const CARD_DATA_MAP: Record<string, ICardData> = {
    '日': {
        id: 1,
        character: '日',
        pinyin: 'rì',
        quality: CardQuality.GOLD,
        oracleBoneSprite: null as any,  // 实际项目中替换为真正的 SpriteFrame 引用
        evolutionSprites: [],
        meaning: '太阳。甲骨文像太阳之形，本义为太阳，后引申为白天、一昼夜等。',
    },
    '月': {
        id: 2,
        character: '月',
        pinyin: 'yuè',
        quality: CardQuality.RED,
        oracleBoneSprite: null as any,
        evolutionSprites: [],
        meaning: '月亮。甲骨文像半月之形，本义为月亮，后引申为月份。',
    },
    '山': {
        id: 3,
        character: '山',
        pinyin: 'shān',
        quality: CardQuality.BLUE,
        oracleBoneSprite: null as any,
        evolutionSprites: [],
        meaning: '山岳。甲骨文像山峰并立之形，本义为山峰。',
    },
    '水': {
        id: 4,
        character: '水',
        pinyin: 'shuǐ',
        quality: CardQuality.BLUE,
        oracleBoneSprite: null as any,
        evolutionSprites: [],
        meaning: '水流。甲骨文像蜿蜒之水形，本义为河流、水流。',
    },
    '火': {
        id: 5,
        character: '火',
        pinyin: 'huǒ',
        quality: CardQuality.RED,
        oracleBoneSprite: null as any,
        evolutionSprites: [],
        meaning: '火焰。甲骨文像火焰升腾之形，本义为燃烧时产生的火焰。',
    },
};

// ======================== 背包控制器组件 ========================

@ccclass('BagUI')
export class BagUI extends Component {

    // ======================== @property 引用区 ========================

    @property({ type: Prefab, displayName: '卡牌 Prefab', tooltip: '卡牌的 Prefab 资源，根节点挂载 CardItem 组件' })
    public cardPrefab: Prefab | null = null;

    @property({ type: ScrollView, displayName: 'ScrollView', tooltip: '背包界面的 ScrollView 组件' })
    public scrollView: ScrollView | null = null;

    @property({ type: Node, displayName: '卡片容器节点', tooltip: 'ScrollView 的 content 节点，所有卡牌实例放置在此' })
    public contentNode: Node | null = null;

    @property({ type: Layout, displayName: 'Layout 布局', tooltip: '卡片容器上的 Layout 组件，自动排列卡牌位置' })
    public cardLayout: Layout | null = null;

    @property({ type: Node, displayName: '学习模式按钮', tooltip: '切换到图鉴学习模式的按钮节点' })
    public studyModeBtn: Node | null = null;

    @property({ type: Node, displayName: '答题模式按钮', tooltip: '切换到占卜答题模式的按钮节点' })
    public examModeBtn: Node | null = null;

    @property({ type: Label, displayName: '模式指示 Label', tooltip: '显示当前展示模式的文字 Label' })
    public modeLabel: Label | null = null;

    // ======================== 运行时状态 ========================

    private _currentMode: BagMode = BagMode.STUDY_MODE;
    private _cardItems: CardItem[] = [];

    // ======================== 生命周期方法 ========================

    /**
     * start —— 组件启动时自动调用
     */
    public start(): void {
        console.log('[BagUI] 背包界面初始化开始');

        // 🌟 1. 直接调用公共刷新方法，读取并渲染初始背包
        this.refresh();

        // 2. 绑定按钮事件
        this.bindModeButtons();

        // 3. 刷新模式指示器
        this.updateModeLabel();

        console.log('[BagUI] 背包界面初始化完成');
    }

    // ======================== 🌟 新增公共接口 ========================

    /**
     * refresh —— 供外部（如 GameManager）在数据变动后手动调用，刷新背包渲染
     */
    public refresh(): void {
        console.log('[BagUI] 正在执行背包数据重绘...');

        // 1. 获取最新数据
        const playerData: PlayerData = PlayerData.getInstance();
        const bagCardNames: string[] = playerData.bagCards;

        // 2. 转换成完整数据
        const cardDataList: ICardData[] = this.buildCardDataList(bagCardNames);

        // 3. 清空旧卡牌
        this.clearAllCards();

        // 4. 重新渲染
        this.renderCards(cardDataList);
    }

    // ======================== 数据构建与渲染 ========================

    private buildCardDataList(cardNames: string[]): ICardData[] {
        const result: ICardData[] = [];
        for (const name of cardNames) {
            const data: ICardData | undefined = CARD_DATA_MAP[name];
            if (data) {
                result.push(data);
            } else {
                console.warn(`[BagUI] 未找到文字「${name}」的完整卡牌数据，跳过渲染`);
            }
        }
        return result;
    }

    private renderCards(dataList: ICardData[]): void {
        if (!this.cardPrefab || !this.contentNode) {
            console.error('[BagUI] cardPrefab 或 contentNode 未赋值，无法渲染卡牌');
            return;
        }

        for (let i = 0; i < dataList.length; i++) {
            const data: ICardData = dataList[i];
            const cardNode: Node = instantiate(this.cardPrefab);
            cardNode.name = `Card_${data.character}`;

            let cardItem: CardItem | null = cardNode.getComponent(CardItem);
            if (!cardItem) {
                cardItem = cardNode.addComponent(CardItem);
            }

            cardItem.init(data, this._currentMode);
            this._cardItems.push(cardItem);
            cardNode.parent = this.contentNode;
        }

        if (this.cardLayout) {
            this.cardLayout.updateLayout();
        }

        if (this.scrollView) {
            this.scrollView.scrollToTop(0.3, true);
        }

        console.log(`[BagUI] 共渲染 ${dataList.length} 张卡牌`);
    }

    private clearAllCards(): void {
        if (!this.contentNode) {
            return;
        }
        const children: Node[] = this.contentNode.children;
        for (let i = children.length - 1; i >= 0; i--) {
            children[i].destroy();
        }
        this._cardItems = [];
    }

    // ======================== 模式切换与清理 ========================

    private bindModeButtons(): void {
        if (this.studyModeBtn) {
            this.studyModeBtn.on(Node.EventType.TOUCH_END, this.switchToStudyMode, this);
        }
        if (this.examModeBtn) {
            this.examModeBtn.on(Node.EventType.TOUCH_END, this.switchToExamMode, this);
        }
    }

    private switchToStudyMode(): void {
        if (this._currentMode === BagMode.STUDY_MODE) {
            return;
        }
        this._currentMode = BagMode.STUDY_MODE;
        this.applyModeToAllCards();
        this.updateModeLabel();
    }

    private switchToExamMode(): void {
        if (this._currentMode === BagMode.EXAM_MODE) {
            return;
        }
        this._currentMode = BagMode.EXAM_MODE;
        this.applyModeToAllCards();
        this.updateModeLabel();
    }

    private applyModeToAllCards(): void {
        for (const cardItem of this._cardItems) {
            cardItem.setMode(this._currentMode);
        }
    }

    private updateModeLabel(): void {
        if (!this.modeLabel) {
            return;
        }
        switch (this._currentMode) {
            case BagMode.STUDY_MODE:
                this.modeLabel.string = '图鉴学习模式';
                break;
            case BagMode.EXAM_MODE:
                this.modeLabel.string = '占卜答题模式';
                break;
            default:
                this.modeLabel.string = '未知模式';
                break;
        }
    }

    public onDestroy(): void {
        if (this.studyModeBtn) {
            this.studyModeBtn.off(Node.EventType.TOUCH_END, this.switchToStudyMode, this);
        }
        if (this.examModeBtn) {
            this.examModeBtn.off(Node.EventType.TOUCH_END, this.switchToExamMode, this);
        }
        this._cardItems = [];
    }
}