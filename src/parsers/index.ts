import {zerodhaBrokerParser} from './zerodha.js'
import {ibkrBrokerParser} from './ibkr.js'

const identifyBroker = function(content:string){
    const idx :number = content.indexOf('\n')
    const attributes: string = content.slice(0,idx)
    const attr_list: Array<string> = attributes.split(',')
    const zerodhaBrokerList:Array<string> = ['symbol','isin','trade_date','trade_type','quantity','price','trade_id','order_id','exchange','segment'
];
    const ibkrBrokerList:Array<string> = ['TradeID','AccountID','Symbol','DateTime','Buy/Sell','Quantity','TradePrice','Currency','Commission','NetAmount','AssetClass'
];

const isIndianBroker:boolean = attr_list.length === zerodhaBrokerList.length && 
                 attr_list.every((val, index) => val.toLowerCase() === zerodhaBrokerList[index]?.toLowerCase());
const isInternationalBroker : boolean = attr_list.length === ibkrBrokerList.length && 
                 attr_list.every((val, index) => val.toLowerCase() === ibkrBrokerList[index]?.toLowerCase());
    if(isIndianBroker) return zerodhaBrokerParser(attr_list,content.slice(idx))
    if (isInternationalBroker) return ibkrBrokerParser(attr_list,content.slice(idx))

    throw new Error('Broker UnIdentified!!');
}