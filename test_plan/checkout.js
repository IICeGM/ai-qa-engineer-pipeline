function calculateFinalPrice(price , discountCode){
    if(typeof price !== 'number' || price < 0){
        throw new Error('Invalid price');
    }

    let discount = 0;
    if(discountCode === 'WELCOME20'){
        discount = 20;
    }else if(discountCode === "HALFPRICE"){
        discount = price * 0.5;
    }else if(discountCode !== undefined && discountCode !== null && discountCode !== ''){
        throw new Error('Invalid discount code');
    }
    const finalPrice = price - discount;

    return finalPrice < 0 ? 0 : finalPrice;
}

module.exports = { calculateFinalPrice };