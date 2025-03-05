import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 複利効果データの型定義
interface CompoundDataItem {
  month: number;
  adCost: number;
  revenue: number;
  profit: number;
  cumulativeAdCost: number;
  cumulativeRevenue: number;
  cumulativeProfit: number;
}

// 入力値の型定義
interface InputValues {
  adCost: number;
  productPrice: number;
  roas: number;
  conversionRate: number;
  profitMargin: number;
  affiliateCommission: number;
  seatCpa: number;
  appointments: number;
  operationDays: number;
  months: number;
  firstMonthFree: boolean;
}

// 計算結果の型定義
interface ResultValues {
  revenue: number;
  profit: number;
  profitBeforeAdCost: number;
  numberOfSales: number;
  cpa: number;
  roasActual: number;
  seatCount: number;
  dailyCost: number;
  affiliateAmount: number;
  profitAmount: number;
}

const AdSimulator = () => {
  // 初期値設定
  const [inputs, setInputs] = useState<InputValues>({
    adCost: 500000, // 広告運用費
    productPrice: 600000, // 商品単価
    roas: 300, // ROAS (%)
    conversionRate: 20, // 成約率 (%)
    profitMargin: 60, // 利益率 (%)
    affiliateCommission: 20, // 成果報酬 (%)
    seatCpa: 60000, // 着席CPA
    appointments: 8, // アポ数
    operationDays: 30, // 運用日数(月)
    months: 12, // シミュレーション期間（月）
    firstMonthFree: true, // 初月広告費無料
  });

  // 計算結果の状態
  const [results, setResults] = useState<ResultValues>({
    revenue: 0,
    profit: 0,
    profitBeforeAdCost: 0, // 広告費を差し引かない利益
    numberOfSales: 0,
    cpa: 0,
    roasActual: 0,
    seatCount: 0,
    dailyCost: 0,
    affiliateAmount: 0,
    profitAmount: 0
  });

  // 複利効果のデータ
  const [compoundData, setCompoundData] = useState<CompoundDataItem[]>([]);

  // 入力変更ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: parseFloat(value) || 0
    });
  };

  // 計算処理
  useEffect(() => {
    const calculate = () => {
      // 売上 = 広告費 * ROAS / 100
      const revenue = inputs.adCost * inputs.roas / 100;
      
      // 販売数 = 売上 / 商品単価
      const numberOfSales = inputs.productPrice > 0 ? revenue / inputs.productPrice : 0;
      
      // CPA = 広告費 / 販売数
      const cpa = numberOfSales > 0 ? inputs.adCost / numberOfSales : 0;
      
      // 利益額 = 売上 * 利益率 / 100
      const profitAmount = revenue * inputs.profitMargin / 100;
      
      // 成果報酬額 = 利益額 * 成果報酬率 / 100
      const affiliateAmount = profitAmount * inputs.affiliateCommission / 100;
      
      // 利益計算（広告費を差し引かない - 表示用）
      const profitBeforeAdCost = profitAmount - affiliateAmount;
      
      // 純利益計算（広告費を差し引く）
      const profit = inputs.firstMonthFree 
        ? profitBeforeAdCost
        : profitBeforeAdCost - inputs.adCost;
      
      // 実際のROAS = 売上 / 広告費 * 100
      const roasActual = inputs.adCost > 0 ? (revenue / inputs.adCost) * 100 : 0;
      
      // 着席数 = 広告費 / 着席CPA
      const seatCount = inputs.seatCpa > 0 ? inputs.adCost / inputs.seatCpa : 0;
      
      // 日次広告費 = 広告費 / 運用日数
      const dailyCost = inputs.operationDays > 0 ? inputs.adCost / inputs.operationDays : 0;
      
      setResults({
        revenue,
        profit,
        profitBeforeAdCost, // 広告費を差し引かない利益を追加
        numberOfSales,
        cpa,
        roasActual,
        seatCount,
        dailyCost,
        affiliateAmount,
        profitAmount
      });

      // 複利効果計算
      calculateCompoundEffect(profit);
    };

    calculate();
  }, [inputs]);

  // 複利効果の計算
  const calculateCompoundEffect = (monthlyProfit: number) => {
    const data: CompoundDataItem[] = [];
    let cumulativeAdCost = 0; // 初月は広告費無料の場合は0から開始
    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;
    let currentAdCost = inputs.adCost;

    for (let month = 0; month <= inputs.months; month++) {
      // 最初の月は初期値
      if (month === 0) {
        data.push({
          month,
          adCost: currentAdCost,
          revenue: 0,
          profit: 0,
          cumulativeAdCost,
          cumulativeRevenue: 0,
          cumulativeProfit: 0
        });
        continue;
      }

      // 今月の売上を計算（ROASに基づく）
      const monthlyRevenue = currentAdCost * inputs.roas / 100;
      
      // 利益額と成果報酬額を計算
      const profitAmount = monthlyRevenue * (inputs.profitMargin / 100);
      const affiliateAmount = profitAmount * (inputs.affiliateCommission / 100);
      
      // 月次利益計算（広告費を差し引かない）
      const monthlyProfitBeforeAdCost = profitAmount - affiliateAmount;
      
      // 純利益計算（広告費を差し引く - 累積利益の計算用）
      const netProfit = month === 1 && inputs.firstMonthFree
        ? monthlyProfitBeforeAdCost
        : monthlyProfitBeforeAdCost - currentAdCost;
      
      // 累積値の更新（初月のみ広告費を加算しない）
      if (!(month === 1 && inputs.firstMonthFree)) {
        cumulativeAdCost += currentAdCost;
      }
      cumulativeRevenue += monthlyRevenue;
      cumulativeProfit += netProfit;

      data.push({
        month,
        adCost: currentAdCost,
        revenue: monthlyRevenue,
        profit: monthlyProfitBeforeAdCost, // 広告費を差し引かない利益
        cumulativeAdCost,
        cumulativeRevenue,
        cumulativeProfit
      });
      
      // 次月の広告費は当月の利益全額（広告費を差し引かない利益）
      if (monthlyProfitBeforeAdCost > 0) {
        currentAdCost = monthlyProfitBeforeAdCost;
      } else {
        currentAdCost = inputs.adCost; // 利益がマイナスの場合は初期広告費に設定
      }
    }

    setCompoundData(data);
  };

  // 数値フォーマット関数
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">広告運用シミュレーター</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 入力パネル */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">パラメータ設定</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">広告運用費 (円)</label>
                <input
                  type="number"
                  name="adCost"
                  value={inputs.adCost}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">商品単価 (円)</label>
                <input
                  type="number"
                  name="productPrice"
                  value={inputs.productPrice}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">ROAS (%)</label>
                <input
                  type="number"
                  name="roas"
                  value={inputs.roas}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">成約率 (%)</label>
                <input
                  type="number"
                  name="conversionRate"
                  value={inputs.conversionRate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">利益率 (%)</label>
                <input
                  type="number"
                  name="profitMargin"
                  value={inputs.profitMargin}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">成果報酬 (%)</label>
                <input
                  type="number"
                  name="affiliateCommission"
                  value={inputs.affiliateCommission}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">着席CPA (円)</label>
                <input
                  type="number"
                  name="seatCpa"
                  value={inputs.seatCpa}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">アポ数</label>
                <input
                  type="number"
                  name="appointments"
                  value={inputs.appointments}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">運用日数(月)</label>
                <input
                  type="number"
                  name="operationDays"
                  value={inputs.operationDays}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">シミュレーション期間 (月)</label>
                <input
                  type="number"
                  name="months"
                  value={inputs.months}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="firstMonthFree"
                    name="firstMonthFree"
                    checked={inputs.firstMonthFree}
                    onChange={(e) => {
                      setInputs({
                        ...inputs,
                        firstMonthFree: e.target.checked
                      });
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="firstMonthFree" className="ml-2 block text-sm text-gray-700">
                    初月広告費無料
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* 結果パネル */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600">シミュレーション結果</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">売上</div>
                <div className="text-xl font-bold">{formatNumber(results.revenue)} 円</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">販売数</div>
                <div className="text-xl font-bold">{formatNumber(results.numberOfSales)} 件</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">利益（広告費差引前）</div>
                <div className="text-xl font-bold text-purple-600">{formatNumber(results.profitBeforeAdCost)} 円</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">純利益（広告費差引後）</div>
                <div className={`text-xl font-bold ${results.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatNumber(results.profit)} 円
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">実際のROAS</div>
                <div className="text-xl font-bold">{formatNumber(results.roasActual)} %</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">CPA (獲得単価)</div>
                <div className="text-xl font-bold">{formatNumber(results.cpa)} 円</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">着席数 (予測)</div>
                <div className="text-xl font-bold">{formatNumber(results.seatCount)} 人</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow">
                <div className="text-sm text-gray-500">日次広告費</div>
                <div className="text-xl font-bold">{formatNumber(results.dailyCost)} 円/日</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow col-span-2">
                <div className="text-sm text-gray-500 mb-1">広告効果の分析</div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    広告費 {formatNumber(inputs.adCost)}円 → 売上 {formatNumber(results.revenue)}円 → 
                    利益（広告費差引前） {formatNumber(results.profitBeforeAdCost)}円
                  </p>
                  <p>
                    {inputs.firstMonthFree && <span className="text-blue-600 font-medium">初月広告費無料</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 複利効果グラフ - シミュレーション結果の下に配置 */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600">複利効果グラフ</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={compoundData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  label={{ value: '月数', position: 'insideBottomRight', offset: -5 }} 
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                />
                <Tooltip formatter={(value) => formatNumber(Number(value)) + ' 円'} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cumulativeRevenue" 
                  name="累積売上" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cumulativeProfit" 
                  name="累積利益" 
                  stroke="#82ca9d" 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cumulativeAdCost" 
                  name="累積広告費" 
                  stroke="#ff7300" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 複利効果表 */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">複利効果表</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">月</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">月次広告費</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">月次売上</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="tooltip">
                    月次利益
                    <span className="tooltiptext">広告費を差し引く前の利益（利益額 - 成果報酬額）</span>
                  </span>
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">累積広告費</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">累積売上</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="tooltip">
                    累積利益
                    <span className="tooltiptext">広告費を差し引いた後の純利益の累積</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {compoundData.map((item) => (
                <tr key={item.month} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap text-center">{item.month}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">{formatNumber(item.adCost)} 円</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">{formatNumber(item.revenue)} 円</td>
                  <td className={`px-2 py-2 whitespace-nowrap text-center ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(item.profit)} 円
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">{formatNumber(item.cumulativeAdCost)} 円</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">{formatNumber(item.cumulativeRevenue)} 円</td>
                  <td className={`px-2 py-2 whitespace-nowrap text-center ${item.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(item.cumulativeProfit)} 円
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 追加情報 */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-700 mb-2">計算方法について</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              このシミュレーションでは、<strong>各月の「利益（広告費差引前）」を次月の広告費として全額再投資</strong>する計算をしています。
              {inputs.firstMonthFree && <span> 初月の広告費は無料のため、月次利益と純利益は同額になります。</span>}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>月次利益 = 利益額 - 成果報酬額（広告費を差し引かない）</li>
              <li>純利益 = 利益額 - 成果報酬額 - 広告費（広告費を差し引く）</li>
              <li>次月広告費 = 前月の月次利益</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdSimulator;