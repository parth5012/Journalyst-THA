import {zerodhaBrokerParser} from './zerodha.js'
import {ibkrBrokerParser} from './ibkr.js'

const identifyBroker = function(content:string){
    const idx = content.indexOf('\n')
    const attributes = content.slice(0,idx)
    const attr_list = attributes.split(',')
    const zerodhaBrokerList:Array<string> = ['symbol','isin','trade_date','trade_type','quantity','price','trade_id','order_id','exchange','segment'
];
    const ibkrBrokerList:Array<string> = ['TradeID','AccountID','Symbol','DateTime','Buy/Sell','Quantity','TradePrice','Currency','Commission','NetAmount','AssetClass'
];

const isIndianBroker = attr_list.length === zerodhaBrokerList.length && 
                 attr_list.every((val, index) => val.toLowerCase() === zerodhaBrokerList[index]?.toLowerCase());
const isInternationalBroker = attr_list.length === ibkrBrokerList.length && 
                 attr_list.every((val, index) => val.toLowerCase() === ibkrBrokerList[index]?.toLowerCase());
    if(isIndianBroker) return zerodhaBrokerParser(attr_list,content.slice(idx))
    if (isInternationalBroker) return ibkrBrokerParser(attr_list,content.slice(idx))
}