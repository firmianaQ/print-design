/**
 * 编译器冒烟测试（独立运行，不依赖浏览器/Vue）
 * 用法： node scripts/test-compiler.mjs
 *
 * 通过 tsx 直接执行 TS 源 —— 无需预编译。
 * 已适配「布局表格 + 隐式行」模型：输出为 <table> 骨架，按 row 分组为 <tr>。
 */
import { generateHTML, resolvePath, styleToString } from '../src/compiler.ts'
import { SAMPLE_SCHEMA, SAMPLE_DATA } from '../src/demo/sampleSchema.ts'
import { cloneDeep } from 'lodash-es'

let pass = 0
let fail = 0
function check(name, cond) {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}`)
  }
}

console.log('\n[1] 工具函数')
check('resolvePath 嵌套取值', resolvePath({ a: { b: { c: 7 } } }, 'a.b.c') === 7)
check('resolvePath 数组下标', resolvePath({ list: [{ id: 5 }] }, 'list.0.id') === 5)
check('resolvePath 缺失路径返回 fallback', resolvePath({}, 'x.y', '默认') === '默认')
check('resolvePath null 安全', resolvePath(null, 'a', 'fb') === 'fb')
check('styleToString px 单位', styleToString({ fontSize: 14 }) === 'font-size:14px;')
check('styleToString 无单位属性', styleToString({ fontWeight: 700 }) === 'font-weight:700;')
check('styleToString kebab 转换', styleToString({ textAlign: 'center' }) === 'text-align:center;')
check('styleToString 跳过空值', styleToString({ color: '', fontWeight: 'bold' }) === 'font-weight:bold;')

console.log('\n[2] 布局表格骨架（generateHTML 整体）')
const html = generateHTML(SAMPLE_SCHEMA, SAMPLE_DATA)

check('包含 @page 规则', html.includes('@page'))
check('@page 宽度 80mm', html.includes('size: 80mm auto'))
check('@page margin: 0', html.includes('margin: 0'))
check('外层布局表 print-root', html.includes('<table class="print-root"'))
check('布局表 border-collapse', html.includes('border-collapse:collapse') || html.includes('borderCollapse:collapse'))
check('colgroup 12 列基准', (html.match(/<col \/>/g) || []).length === 12)
check('输出为 <tr> 行结构', html.includes('<tr>'))
check('输出为 <td> 单元格', html.includes('<td'))
check('不含绝对定位（无 position:absolute）', !html.includes('position:absolute'))
check('不含 flex/grid', !html.includes('display:flex') && !html.includes('display:grid'))

console.log('\n[3] 业务数据渲染')
check('包含桌号 A12', html.includes('A12'))
check('包含店铺名', html.includes('老王川菜馆'))
check('包含下单时间', html.includes('2026-06-14 12:30:45'))
check('包含备注', html.includes('少辣，不要香菜'))

console.log('\n[4] 行列布局（隐式行 + 同行并排）')
check('满宽元素 colspan=12', html.includes('colspan="12"'))
// 下单时间(row3,col0) + 备注(row3,col6) 同行并排，各 colspan=6
const sixCount = (html.match(/colspan="6"/g) || []).length
check('同行并排：两个 colspan=6（时间+备注）', sixCount === 2)
check('同一 <tr> 内含两个 <td>（并排）', /<tr><td[^]*?<td/.test(html))

console.log('\n[5] 表格高级特性（嵌套表格）')
check('嵌套表格 thead 渲染', html.includes('<thead><tr>'))
check('表头 菜品/数量/单位', html.includes('菜品') && html.includes('数量') && html.includes('单位'))
check('宫保鸡丁 行', html.includes('宫保鸡丁'))
check('合计行加粗 (fontWeight bold)', html.includes('font-weight:bold'))
check('合计行放大字号 (14px)', html.includes('font-size:14px'))
check('合计行内容', html.includes('合计 6 件'))

console.log('\n[6] 树形递归 children')
check('套餐父行', html.includes('双人套餐（含 3 道）'))
check('子行 data-child 标记', html.includes('data-child="1"'))
check('子行缩进 padding-left', html.includes('padding-left:12px'))
check('子行 水煮鱼', html.includes('├ 水煮鱼'))
check('子行 加冰', html.includes('└ 加冰'))

console.log('\n[7] 图片渲染')
check('img 标签', html.includes('<img'))
check('logo URL 注入', html.includes('data:image/svg+xml'))
check('object-fit', html.includes('object-fit:contain'))

console.log('\n[8] 表格列配置（隐藏 / 改列名）')
const tableSchema = cloneDeep(SAMPLE_SCHEMA)
const tableEl = tableSchema.elements.find((e) => e.id === 'kit-items')
// 隐藏「单位」列
tableEl.columns.find((c) => c.key === 'unit').hidden = true
// 改「菜品」列名为「名称」
tableEl.columns.find((c) => c.key === 'name').label = '名称'
const tableHtml = generateHTML(tableSchema, SAMPLE_DATA)
check('隐藏列：表头不含"单位"', !tableHtml.includes('>单位<'))
check('隐藏列：数据单元格不含"份/碗/套"', !tableHtml.match(/>(份|碗|套|杯)</))
check('改列名：表头出现"名称"', tableHtml.includes('>名称<'))
check('未隐藏列仍渲染"数量"', tableHtml.includes('>数量<'))

console.log('\n[9] 表格线 / 表头开关')
// 默认无表格线
check('默认无表格线 border', !html.includes('border:1px solid'))
// 开启表格线 + 自定义宽/色
tableEl.bordered = true
tableEl.borderWidth = 2
tableEl.borderColor = '#999'
const borderedHtml = generateHTML(tableSchema, SAMPLE_DATA)
check('开启表格线渲染 border:2px', borderedHtml.includes('border:2px solid #999'))
// 关闭表头
tableEl.showHeader = false
const noHeadHtml = generateHTML(tableSchema, SAMPLE_DATA)
check('showHeader=false 无 thead', !noHeadHtml.includes('<thead>'))

console.log(`\n结果: ${pass} 通过, ${fail} 失败\n`)
process.exit(fail === 0 ? 0 : 1)
