import { TradeSchema } from "../targetSchema.js";

export const indianBrokers = function(attributes:Array<string>,content:string){
    let trades = [];
    for(const line of content.split('\n')){
        if (!line.trim()) continue  // also skip empty lines
        const list = line.split(',')
        const quantity = parseFloat(list[4] ?? '0');
        const price = parseFloat(list[5] ?? '0');

        const instance = TradeSchema.parse({
            symbol: list[0],
            side : list[3]?.toUpperCase(),
            quantity: quantity,
            price: price,
            totalAmount: quantity*price,
            currency: 'INR',
            executedAt: new Date(list[2] ?? '').toISOString(),
            broker: 'zerodha',
            rawData: {
                'isin': list[1],
                'trade_id': list[6],
                'order_id': list[7],
                'exchange': list[8],
                'segment': list[9]
            }
            
        })
        trades.push(instance)
    }
    return trades;
}
