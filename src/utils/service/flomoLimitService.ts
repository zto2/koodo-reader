import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

export interface FlomoUsageData {
  date: string;
  count: number;
}

export class FlomoLimitService {
  private static readonly DAILY_LIMIT = 100;
  private static readonly STORAGE_KEY = "flomoUsageData";

  /**
   * 获取今天的日期字符串 (YYYY-MM-DD)
   */
  private static getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * 获取今天的使用数据
   */
  private static getTodayUsage(): FlomoUsageData {
    const today = this.getTodayString();
    const usageData = ConfigService.getObjectConfig("", this.STORAGE_KEY, {});
    
    return {
      date: today,
      count: usageData[today] || 0
    };
  }

  /**
   * 更新今天的使用次数
   */
  private static updateTodayUsage(count: number): void {
    const today = this.getTodayString();
    const usageData = ConfigService.getObjectConfig("", this.STORAGE_KEY, {});
    
    // 清理7天前的数据，避免存储过多历史数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    Object.keys(usageData).forEach(date => {
      if (date < cutoffDate) {
        delete usageData[date];
      }
    });
    
    usageData[today] = count;
    ConfigService.setObjectConfig("", this.STORAGE_KEY, usageData);
  }

  /**
   * 检查是否可以导出指定数量的条目
   */
  public static canExport(requestedCount: number = 1): boolean {
    const todayUsage = this.getTodayUsage();
    return (todayUsage.count + requestedCount) <= this.DAILY_LIMIT;
  }

  /**
   * 获取今天剩余的导出次数
   */
  public static getRemainingCount(): number {
    const todayUsage = this.getTodayUsage();
    return Math.max(0, this.DAILY_LIMIT - todayUsage.count);
  }

  /**
   * 获取今天已使用的导出次数
   */
  public static getUsedCount(): number {
    const todayUsage = this.getTodayUsage();
    return todayUsage.count;
  }

  /**
   * 记录一次导出操作
   */
  public static recordExport(count: number = 1): void {
    const todayUsage = this.getTodayUsage();
    this.updateTodayUsage(todayUsage.count + count);
  }

  /**
   * 获取每日限制数量
   */
  public static getDailyLimit(): number {
    return this.DAILY_LIMIT;
  }

  /**
   * 获取使用统计信息
   */
  public static getUsageStats(): {
    used: number;
    remaining: number;
    limit: number;
    percentage: number;
  } {
    const used = this.getUsedCount();
    const remaining = this.getRemainingCount();
    const limit = this.getDailyLimit();
    const percentage = Math.round((used / limit) * 100);

    return {
      used,
      remaining,
      limit,
      percentage
    };
  }

  /**
   * 重置今天的使用计数（仅用于测试或管理员功能）
   */
  public static resetTodayUsage(): void {
    const today = this.getTodayString();
    const usageData = ConfigService.getObjectConfig("", this.STORAGE_KEY, {});
    usageData[today] = 0;
    ConfigService.setObjectConfig("", this.STORAGE_KEY, usageData);
  }
}
