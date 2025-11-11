/**
 * 请求频率限制器
 * 防止API滥用，保护用户账户安全
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private readonly MAX_REQUESTS_PER_MINUTE = 30; // 每分钟最多30次请求
  private readonly MAX_REQUESTS_PER_HOUR = 500; // 每小时最多500次请求
  private readonly MINUTE = 60 * 1000;
  private readonly HOUR = 60 * 60 * 1000;

  private minuteRecord: RateLimitRecord = {
    count: 0,
    resetTime: Date.now() + this.MINUTE,
  };

  private hourRecord: RateLimitRecord = {
    count: 0,
    resetTime: Date.now() + this.HOUR,
  };

  /**
   * 检查是否可以继续请求
   * @returns true表示可以请求，false表示超过限制
   */
  async checkLimit(): Promise<boolean> {
    const now = Date.now();

    // 重置分钟计数器
    if (now > this.minuteRecord.resetTime) {
      this.minuteRecord = {
        count: 0,
        resetTime: now + this.MINUTE,
      };
    }

    // 重置小时计数器
    if (now > this.hourRecord.resetTime) {
      this.hourRecord = {
        count: 0,
        resetTime: now + this.HOUR,
      };
    }

    // 检查是否超过限制
    if (this.minuteRecord.count >= this.MAX_REQUESTS_PER_MINUTE) {
      console.warn('已达到每分钟请求限制');
      return false;
    }

    if (this.hourRecord.count >= this.MAX_REQUESTS_PER_HOUR) {
      console.warn('已达到每小时请求限制');
      return false;
    }

    // 增加计数
    this.minuteRecord.count++;
    this.hourRecord.count++;

    return true;
  }

  /**
   * 获取剩余配额
   */
  getRemainingQuota(): {
    perMinute: number;
    perHour: number;
    minuteResetIn: number;
    hourResetIn: number;
  } {
    const now = Date.now();

    return {
      perMinute: Math.max(0, this.MAX_REQUESTS_PER_MINUTE - this.minuteRecord.count),
      perHour: Math.max(0, this.MAX_REQUESTS_PER_HOUR - this.hourRecord.count),
      minuteResetIn: Math.max(0, this.minuteRecord.resetTime - now),
      hourResetIn: Math.max(0, this.hourRecord.resetTime - now),
    };
  }

  /**
   * 重置所有计数器
   */
  reset(): void {
    const now = Date.now();
    
    this.minuteRecord = {
      count: 0,
      resetTime: now + this.MINUTE,
    };

    this.hourRecord = {
      count: 0,
      resetTime: now + this.HOUR,
    };
  }
}

