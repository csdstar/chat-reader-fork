'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { ChevronDown, Copy, PanelLeftClose, Share, ThumbsDown, ThumbsUp } from 'lucide-react';

type TokenTone = 'plain' | 'keyword' | 'string' | 'number' | 'function' | 'type' | 'comment' | 'operator' | 'property';

type CodeToken = {
  text: string;
  tone?: TokenTone;
};

type CodeLine = CodeToken[];

type Message = {
  role: 'user' | 'assistant';
  content: ReactNode;
};

type Scenario = {
  activeTitle: string;
  history: string[];
  messages: Message[];
};

const TOKEN_CLASS: Record<TokenTone, string> = {
  plain: 'text-[#e6edf3]',
  keyword: 'text-[#ff7b72]',
  string: 'text-[#a5d6ff]',
  number: 'text-[#79c0ff]',
  function: 'text-[#d2a8ff]',
  type: 'text-[#ffa657]',
  comment: 'text-[#8b949e]',
  operator: 'text-[#ff7b72]',
  property: 'text-[#7ee787]',
};

const inlineCodeClass = 'rounded bg-[#f1f1f1] px-1.5 py-0.5 text-[13px] text-[#333]';

function token(text: string, tone: TokenTone = 'plain'): CodeToken {
  return { text, tone };
}

function codeLine(...tokens: CodeToken[]): CodeLine {
  return tokens;
}

function CodeBlock({ language, lines }: { language: string; lines: CodeLine[] }) {
  return (
    <div className="my-4 overflow-hidden rounded-lg bg-[#0d1117] text-[#e6edf3] shadow-sm ring-1 ring-black/10">
      <div className="flex h-10 items-center justify-between bg-[#161b22] px-4 text-xs text-[#8b949e]">
        <span>{language}</span>
        <span className="flex items-center gap-1.5 text-[#c9d1d9]">
          <Copy className="h-3.5 w-3.5" />
          复制代码
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <code>
          {lines.map((line, index) => (
            <div key={index} className="min-h-6 whitespace-pre">
              {line.length === 0
                ? '\u00a0'
                : line.map((part, tokenIndex) => (
                  <span key={tokenIndex} className={TOKEN_CLASS[part.tone ?? 'plain']}>
                    {part.text}
                  </span>
                ))}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code className={inlineCodeClass}>{children}</code>;
}

function AssistantActions() {
  return (
    <div className="mt-3 flex items-center gap-3 text-[#8f8f8f]">
      <Copy className="h-4 w-4" />
      <ThumbsUp className="h-4 w-4" />
      <ThumbsDown className="h-4 w-4" />
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <section className="mb-9 flex justify-end">
      <div className="max-w-[85%] rounded-3xl bg-[#f4f4f4] px-5 py-3 text-[15px] leading-7 md:max-w-[75%]">
        {children}
      </div>
    </section>
  );
}

function AssistantMessage({ children }: { children: ReactNode }) {
  return (
    <section className="mb-10 text-[15px] leading-7 text-[#202123]">
      {children}
      <AssistantActions />
    </section>
  );
}

const SCENARIOS: Scenario[] = [
  {
    activeTitle: '优化订单查询接口',
    history: ['优化订单查询接口', '排查 Redis 缓存击穿', '设计文件上传重试机制', 'Review 支付回调逻辑', 'Next.js 鉴权中间件'],
    messages: [
      {
        role: 'user',
        content: '我们的订单查询接口在高峰期 P95 从 180ms 升到了 1.6s。服务使用 Next.js API Route 和 PostgreSQL，列表页需要按用户、状态和时间范围筛选。下面这段查询应该从哪里开始优化？',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>先不要直接加缓存。从这个查询形态看，最可能的问题是复合索引缺失，以及分页方式导致数据库扫描了过多历史记录。</p>
            <h2 className="mb-2 mt-6 text-lg font-semibold">建议先确认执行计划</h2>
            <CodeBlock
              language="sql"
              lines={[
                codeLine(token('EXPLAIN', 'keyword'), token(' ('), token('ANALYZE', 'keyword'), token(', '), token('BUFFERS', 'keyword'), token(')')),
                codeLine(token('SELECT', 'keyword'), token(' id, status, total_amount, created_at')),
                codeLine(token('FROM', 'keyword'), token(' orders')),
                codeLine(token('WHERE', 'keyword'), token(' user_id '), token('=', 'operator'), token(' $1')),
                codeLine(token('  AND', 'keyword'), token(' status '), token('=', 'operator'), token(' '), token('ANY', 'function'), token('($2)')),
                codeLine(token('  AND', 'keyword'), token(' created_at '), token('>=', 'operator'), token(' $3')),
                codeLine(token('ORDER BY', 'keyword'), token(' created_at '), token('DESC', 'keyword')),
                codeLine(token('LIMIT', 'keyword'), token(' '), token('50', 'number'), token(';')),
              ]}
            />
            <p>
              重点检查 <InlineCode>Seq Scan</InlineCode>、实际扫描行数和 buffer hit/read。如果过滤后只返回 50 行，但扫描了几十万行，索引就是首要问题。
            </p>
            <h2 className="mb-2 mt-6 text-lg font-semibold">建立与查询顺序匹配的索引</h2>
            <CodeBlock
              language="sql"
              lines={[
                codeLine(token('CREATE INDEX CONCURRENTLY', 'keyword'), token(' idx_orders_user_status_created')),
                codeLine(token('ON', 'keyword'), token(' orders (user_id, status, created_at '), token('DESC', 'keyword'), token(')')),
                codeLine(token('INCLUDE', 'keyword'), token(' (total_amount);')),
              ]}
            />
            <ul className="my-4 list-disc space-y-1 pl-6">
              <li><InlineCode>user_id</InlineCode> 是等值条件，应放在最前。</li>
              <li><InlineCode>created_at DESC</InlineCode> 与排序方向一致，可减少额外排序。</li>
              <li>使用 <InlineCode>CONCURRENTLY</InlineCode> 避免上线时长时间阻塞写入。</li>
            </ul>
          </>
        ),
      },
      {
        role: 'user',
        content: '目前还是用 offset 分页。可以给一个游标分页的 TypeScript 示例吗？需要兼容 created_at 相同的情况。',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>可以使用 <InlineCode>created_at + id</InlineCode> 组成稳定游标。第二个字段用于处理同一时间戳下的确定性排序。</p>
            <CodeBlock
              language="typescript"
              lines={[
                codeLine(token('type', 'keyword'), token(' OrderCursor', 'type'), token(' = {')),
                codeLine(token('  createdAt', 'property'), token(': '), token('string', 'type'), token(';')),
                codeLine(token('  id', 'property'), token(': '), token('string', 'type'), token(';')),
                codeLine(token('};')),
                codeLine(),
                codeLine(token('export', 'keyword'), token(' '), token('async', 'keyword'), token(' '), token('function', 'keyword'), token(' '), token('listOrders', 'function'), token('('), token('userId', 'property'), token(': '), token('string', 'type'), token(', cursor?: '), token('OrderCursor', 'type'), token(') {')),
                codeLine(token('  const', 'keyword'), token(' rows '), token('=', 'operator'), token(' await ', 'keyword'), token('db', 'property'), token('.'), token('query', 'function'), token('(')),
                codeLine(token('    `SELECT id, status, total_amount, created_at', 'string')),
                codeLine(token('     FROM orders', 'string')),
                codeLine(token('     WHERE user_id = $1', 'string')),
                codeLine(token('       AND ($2::timestamptz IS NULL OR (created_at, id) < ($2, $3))', 'string')),
                codeLine(token('     ORDER BY created_at DESC, id DESC', 'string')),
                codeLine(token('     LIMIT 51`,', 'string')),
                codeLine(token('    [userId, cursor?.createdAt ?? null, cursor?.id ?? null]')),
                codeLine(token('  );')),
                codeLine(),
                codeLine(token('  const', 'keyword'), token(' hasMore '), token('=', 'operator'), token(' rows.length '), token('>', 'operator'), token(' '), token('50', 'number'), token(';')),
                codeLine(token('  return', 'keyword'), token(' { items: rows.slice('), token('0', 'number'), token(', '), token('50', 'number'), token('), hasMore };')),
                codeLine(token('}')),
              ]}
            />
            <p>数据库索引也要同步调整为 <InlineCode>(user_id, created_at DESC, id DESC)</InlineCode>。上线前用生产数据量级跑一次执行计划，并观察慢查询与连接池等待时间。</p>
          </>
        ),
      },
    ],
  },
  {
    activeTitle: '修复 React 重渲染',
    history: ['修复 React 重渲染', '拆分账单筛选组件', '整理 Zustand 状态', '优化表格虚拟滚动', '补全单元测试'],
    messages: [
      {
        role: 'user',
        content: '这个订单列表输入筛选条件时整页都在重渲染，React Profiler 里看到 OrderTable 每次输入都会重新算列配置。这里应该怎么改？',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>先把列配置和事件处理器稳定下来。输入框状态变化时，表格不应该收到新的 columns 引用，否则 memo 化也挡不住重渲染。</p>
            <CodeBlock
              language="tsx"
              lines={[
                codeLine(token('const', 'keyword'), token(' columns '), token('=', 'operator'), token(' '), token('useMemo', 'function'), token('(() '), token('=>', 'operator'), token(' [')),
                codeLine(token('  {')),
                codeLine(token('    accessorKey', 'property'), token(': '), token("'status'", 'string'), token(',')),
                codeLine(token('    header', 'property'), token(': '), token("'状态'", 'string'), token(',')),
                codeLine(token('    cell', 'property'), token(': ({ row }) '), token('=>', 'operator'), token(' '), token('<StatusBadge', 'type'), token(' value={row.original.status} />')),
                codeLine(token('  },')),
                codeLine(token('  {')),
                codeLine(token('    accessorKey', 'property'), token(': '), token("'createdAt'", 'string'), token(',')),
                codeLine(token('    header', 'property'), token(': '), token("'创建时间'", 'string'), token(',')),
                codeLine(token('  },')),
                codeLine(token('], []);')),
                codeLine(),
                codeLine(token('const', 'keyword'), token(' handleRowClick '), token('=', 'operator'), token(' '), token('useCallback', 'function'), token('((orderId: '), token('string', 'type'), token(') '), token('=>', 'operator'), token(' {')),
                codeLine(token('  router', 'property'), token('.'), token('push', 'function'), token('(`/orders/${orderId}`);', 'string')),
                codeLine(token('}, [router]);')),
              ]}
            />
            <p>
              然后把 <InlineCode>OrderTable</InlineCode> 包成 <InlineCode>memo</InlineCode>，并确保它只依赖 <InlineCode>rows</InlineCode>、<InlineCode>columns</InlineCode> 和稳定的回调。
            </p>
          </>
        ),
      },
      {
        role: 'user',
        content: '如果接口请求也被输入框每个字符触发，应该在组件里 debounce 还是放到 hook 里？',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>放到数据 hook 里更稳。组件只描述筛选条件，hook 负责把高频输入转成低频查询，这样其它页面复用时也不会漏掉 debounce。</p>
            <CodeBlock
              language="typescript"
              lines={[
                codeLine(token('export', 'keyword'), token(' '), token('function', 'keyword'), token(' '), token('useDebouncedValue', 'function'), token('<'), token('T', 'type'), token('>(value: '), token('T', 'type'), token(', delay = '), token('250', 'number'), token(') {')),
                codeLine(token('  const', 'keyword'), token(' [debounced, setDebounced] '), token('=', 'operator'), token(' '), token('useState', 'function'), token('(value);')),
                codeLine(),
                codeLine(token('  useEffect', 'function'), token('(() '), token('=>', 'operator'), token(' {')),
                codeLine(token('    const', 'keyword'), token(' timer '), token('=', 'operator'), token(' window.'), token('setTimeout', 'function'), token('(() '), token('=>', 'operator'), token(' setDebounced(value), delay);')),
                codeLine(token('    return', 'keyword'), token(' () '), token('=>', 'operator'), token(' window.'), token('clearTimeout', 'function'), token('(timer);')),
                codeLine(token('  }, [value, delay]);')),
                codeLine(),
                codeLine(token('  return', 'keyword'), token(' debounced;')),
                codeLine(token('}')),
              ]}
            />
            <p>如果请求库支持缓存键，缓存键里使用 debounce 后的值，输入态则继续用原始值保证 UI 响应即时。</p>
          </>
        ),
      },
    ],
  },
  {
    activeTitle: '设计文件上传重试',
    history: ['设计文件上传重试', '修复 S3 签名过期', '拆解任务队列状态', '检查上传限流策略', '整理错误码文档'],
    messages: [
      {
        role: 'user',
        content: '文件上传偶尔会因为临时网络失败中断。我们现在直接让用户重新选文件，体验很差。能不能给一个前端重试策略？',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>可以做指数退避，但只重试可恢复错误。鉴权失败、文件过大、格式不支持这类错误应立即展示，不要静默重试。</p>
            <CodeBlock
              language="typescript"
              lines={[
                codeLine(token('const', 'keyword'), token(' RETRYABLE_STATUS '), token('=', 'operator'), token(' '), token('new', 'keyword'), token(' '), token('Set', 'type'), token('(['), token('408', 'number'), token(', '), token('429', 'number'), token(', '), token('500', 'number'), token(', '), token('502', 'number'), token(', '), token('503', 'number'), token(', '), token('504', 'number'), token(']);')),
                codeLine(),
                codeLine(token('function', 'keyword'), token(' '), token('sleep', 'function'), token('(ms: '), token('number', 'type'), token(') {')),
                codeLine(token('  return', 'keyword'), token(' '), token('new', 'keyword'), token(' '), token('Promise', 'type'), token('(resolve '), token('=>', 'operator'), token(' '), token('setTimeout', 'function'), token('(resolve, ms));')),
                codeLine(token('}')),
                codeLine(),
                codeLine(token('export', 'keyword'), token(' '), token('async', 'keyword'), token(' '), token('function', 'keyword'), token(' '), token('uploadWithRetry', 'function'), token('(file: '), token('File', 'type'), token(', signal: '), token('AbortSignal', 'type'), token(') {')),
                codeLine(token('  for', 'keyword'), token(' ('), token('let', 'keyword'), token(' attempt '), token('=', 'operator'), token(' '), token('0', 'number'), token('; attempt '), token('<', 'operator'), token(' '), token('4', 'number'), token('; attempt'), token('++', 'operator'), token(') {')),
                codeLine(token('    const', 'keyword'), token(' response '), token('=', 'operator'), token(' await ', 'keyword'), token('sendFile', 'function'), token('(file, signal);')),
                codeLine(token('    if', 'keyword'), token(' (response.ok) '), token('return', 'keyword'), token(' response;')),
                codeLine(),
                codeLine(token('    if', 'keyword'), token(' (!RETRYABLE_STATUS.has(response.status)) '), token('throw', 'keyword'), token(' '), token('new', 'keyword'), token(' '), token('UploadError', 'type'), token('(response);')),
                codeLine(token('    await', 'keyword'), token(' '), token('sleep', 'function'), token('('), token('2', 'number'), token(' ** attempt * '), token('400', 'number'), token(');')),
                codeLine(token('  }')),
                codeLine(token('  throw', 'keyword'), token(' '), token('new', 'keyword'), token(' '), token('Error', 'type'), token('('), token("'上传失败，请稍后重试'", 'string'), token(');')),
                codeLine(token('}')),
              ]}
            />
            <p>如果文件较大，建议再做分片上传和断点续传。前端只保存分片状态，不保存完整文件副本。</p>
          </>
        ),
      },
      {
        role: 'user',
        content: '上传组件里需要展示哪些状态？',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>至少区分五类：排队中、上传中、重试等待、失败可重试、失败不可重试。这样用户知道系统是在处理，还是需要自己介入。</p>
            <CodeBlock
              language="typescript"
              lines={[
                codeLine(token('type', 'keyword'), token(' UploadState', 'type'), token(' =')),
                codeLine(token('  |', 'operator'), token(' { type: '), token("'queued'", 'string'), token(' }')),
                codeLine(token('  |', 'operator'), token(' { type: '), token("'uploading'", 'string'), token('; progress: '), token('number', 'type'), token(' }')),
                codeLine(token('  |', 'operator'), token(' { type: '), token("'retrying'", 'string'), token('; nextAttemptAt: '), token('number', 'type'), token(' }')),
                codeLine(token('  |', 'operator'), token(' { type: '), token("'failed'", 'string'), token('; retryable: '), token('boolean', 'type'), token('; message: '), token('string', 'type'), token(' }')),
                codeLine(token('  |', 'operator'), token(' { type: '), token("'done'", 'string'), token('; fileId: '), token('string', 'type'), token(' };')),
              ]}
            />
            <p>状态机清楚以后，UI 会更容易测。尤其是取消上传和重试按钮，不要和普通失败提示混在一起。</p>
          </>
        ),
      },
    ],
  },
  {
    activeTitle: '排查 Redis 缓存击穿',
    history: ['排查 Redis 缓存击穿', '优化库存扣减事务', '压测报告复盘', '改造任务幂等键', '定位内存泄漏'],
    messages: [
      {
        role: 'user',
        content: '商品详情缓存过期时会把数据库打满。我们现在是 Redis miss 后每个请求都查 DB，再 set cache。如何改成比较稳的实现？',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>这是典型缓存击穿。先加单飞锁，让同一个商品只有一个请求回源，其它请求短暂等待或返回旧缓存。</p>
            <CodeBlock
              language="typescript"
              lines={[
                codeLine(token('export', 'keyword'), token(' '), token('async', 'keyword'), token(' '), token('function', 'keyword'), token(' '), token('getProduct', 'function'), token('(id: '), token('string', 'type'), token(') {')),
                codeLine(token('  const', 'keyword'), token(' cacheKey '), token('=', 'operator'), token(' `product:${id}`;', 'string')),
                codeLine(token('  const', 'keyword'), token(' cached '), token('=', 'operator'), token(' await ', 'keyword'), token('redis', 'property'), token('.'), token('get', 'function'), token('(cacheKey);')),
                codeLine(token('  if', 'keyword'), token(' (cached) '), token('return', 'keyword'), token(' '), token('JSON', 'type'), token('.'), token('parse', 'function'), token('(cached);')),
                codeLine(),
                codeLine(token('  const', 'keyword'), token(' lockKey '), token('=', 'operator'), token(' `lock:${cacheKey}`;', 'string')),
                codeLine(token('  const', 'keyword'), token(' locked '), token('=', 'operator'), token(' await ', 'keyword'), token('redis', 'property'), token('.'), token('set', 'function'), token('(lockKey, '), token("'1'", 'string'), token(', { NX: '), token('true', 'keyword'), token(', EX: '), token('10', 'number'), token(' });')),
                codeLine(token('  if', 'keyword'), token(' (!locked) '), token('return', 'keyword'), token(' '), token('waitForCache', 'function'), token('(cacheKey);')),
                codeLine(),
                codeLine(token('  try', 'keyword'), token(' {')),
                codeLine(token('    const', 'keyword'), token(' product '), token('=', 'operator'), token(' await ', 'keyword'), token('db', 'property'), token('.product.'), token('findUnique', 'function'), token('({ where: { id } });')),
                codeLine(token('    await', 'keyword'), token(' redis.'), token('set', 'function'), token('(cacheKey, '), token('JSON', 'type'), token('.'), token('stringify', 'function'), token('(product), { EX: '), token('300', 'number'), token(' });')),
                codeLine(token('    return', 'keyword'), token(' product;')),
                codeLine(token('  } finally', 'keyword'), token(' {')),
                codeLine(token('    await', 'keyword'), token(' redis.'), token('del', 'function'), token('(lockKey);')),
                codeLine(token('  }')),
                codeLine(token('}')),
              ]}
            />
            <p>另外可以给过期时间加随机抖动，避免大量 key 同一秒集中失效。</p>
          </>
        ),
      },
      {
        role: 'user',
        content: '如果等待缓存也超时，是不是可以直接打数据库？',
      },
      {
        role: 'assistant',
        content: (
          <>
            <p>不要让等待失败的请求全部回源，那会把锁绕开。更稳的是返回旧值，或返回短错误并让前端重试。</p>
            <CodeBlock
              language="typescript"
              lines={[
                codeLine(token('async', 'keyword'), token(' '), token('function', 'keyword'), token(' '), token('waitForCache', 'function'), token('(key: '), token('string', 'type'), token(') {')),
                codeLine(token('  for', 'keyword'), token(' ('), token('let', 'keyword'), token(' i '), token('=', 'operator'), token(' '), token('0', 'number'), token('; i '), token('<', 'operator'), token(' '), token('6', 'number'), token('; i'), token('++', 'operator'), token(') {')),
                codeLine(token('    await', 'keyword'), token(' '), token('sleep', 'function'), token('('), token('80', 'number'), token(' + i * '), token('40', 'number'), token(');')),
                codeLine(token('    const', 'keyword'), token(' value '), token('=', 'operator'), token(' await ', 'keyword'), token('redis', 'property'), token('.'), token('get', 'function'), token('(key);')),
                codeLine(token('    if', 'keyword'), token(' (value) '), token('return', 'keyword'), token(' '), token('JSON', 'type'), token('.'), token('parse', 'function'), token('(value);')),
                codeLine(token('  }')),
                codeLine(token('  throw', 'keyword'), token(' '), token('new', 'keyword'), token(' '), token('ServiceUnavailableError', 'type'), token('('), token("'缓存刷新中，请稍后重试'", 'string'), token(');')),
                codeLine(token('}')),
              ]}
            />
            <p>如果业务允许，可以维护 stale cache，锁持有者刷新新值，其他请求继续读旧值，这是高峰期最平滑的策略。</p>
          </>
        ),
      },
    ],
  },
];

export const BOSS_SCENARIO_COUNT = SCENARIOS.length;

export function BossScreen({ scenarioIndex = 0 }: { scenarioIndex?: number }) {
  const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length];

  return (
    <div className="fixed inset-0 z-[100] flex bg-white text-[#0d0d0d]">
      <aside className="hidden h-full w-[260px] shrink-0 flex-col bg-[#f9f9f9] md:flex">
        <div className="flex h-16 items-center justify-between px-4">
          <Image src="/icons/chatgpt.svg" alt="ChatGPT" width={28} height={28} priority />
          <PanelLeftClose className="h-5 w-5 text-[#777]" strokeWidth={1.8} />
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-[#ececec]">
            <Image src="/icons/new-chat.svg" alt="" width={20} height={20} />
            <span>新聊天</span>
          </div>
          <div className="mt-5 px-3 pb-2 text-xs font-medium text-[#777]">今天</div>
          {scenario.history.map((item) => (
            <div
              key={item}
              className={`truncate rounded-lg px-3 py-2.5 text-sm ${item === scenario.activeTitle ? 'bg-[#ececec]' : ''}`}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="m-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#202123] font-medium text-white">C</div>
          <div className="min-w-0">
            <div className="truncate font-medium">csdstar</div>
            <div className="text-xs text-[#777]">Plus</div>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-1 text-base font-medium text-[#5d5d5d]">
            ChatGPT 5.2
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#d9d9d9] px-3 py-2 text-sm font-medium">
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline">分享</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5 md:px-8">
            {scenario.messages.map((message, index) => (
              message.role === 'user'
                ? <UserBubble key={index}>{message.content}</UserBubble>
                : <AssistantMessage key={index}>{message.content}</AssistantMessage>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white to-transparent pb-3 pt-8 md:left-[260px]">
          <div className="mx-auto max-w-3xl px-4 md:px-8">
            <div className="rounded-3xl border border-[#dedede] bg-white px-5 py-3 text-sm text-[#8f8f8f] shadow-sm">
              有问题，尽管问
            </div>
            <p className="mt-2 text-center text-[11px] text-[#8f8f8f]">ChatGPT 也可能会犯错。请核查重要信息。</p>
          </div>
        </div>
      </main>
    </div>
  );
}
