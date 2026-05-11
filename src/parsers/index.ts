import {zerodhaBrokerParser} from './zerodha.js'
import {ibkrBrokerParser} from './ibkr.js'

const identifyBroker = function(content:string){
    const idx = content.indexOf('\n')
    const attributes = content.slice(0,idx)
    const attr_list = attributes.split(',')
    const indianBrokersList:Array<string> = []
    const internationalBrokersList:Array<string> = []

const isIndianBroker = attr_list.length === indianBrokersList.length && 
                 attr_list.every((val, index) => val.toLowerCase() === indianBrokersList[index]?.toLowerCase());
const isInternationalBroker = attr_list.length === internationalBrokersList.length && 
                 attr_list.every((val, index) => val.toLowerCase() === internationalBrokersList[index]?.toLowerCase());
    if(isIndianBroker) return zerodhaBrokerParser(attr_list,content.slice(idx))
    if (isInternationalBroker) return ibkrBrokerParser(attr_list,content.slice(idx))
}