
if (!process.env.STRIPE_SECRET) {
    throw new Error('stripe secret key not define')
}
var Product = require("../../models/products")
var async = require("async");
var User = require("../../models/user");
var Order = require("../../models/order");
var sanitize = require("mongo-sanitize");
var math = require("mathjs");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
exports.createToken = function (req, res) {
    try {

        if (!req.body.card) {
            throw new Error('Invalid parameters')
        }

        if (!req.body.card.number || !req.body.card.exp_month || !req.body.card.exp_year || !req.body.card.cvc) {
            throw new Error('Missing required parameters')
        }
        stripe.tokens.create({
            card: req.body.card
        }, function (err, token) {
            if (err) {
                return res.status(400).json({ "status": false, "error": err.message || err })
            }
            return res.status(200).json({ "status": true, "token": token })
        });

    } catch (error) {
        return res.status(500).json({ "status": false, "error": error.message || error })
    }
}

exports.addCard = function (req, res) {
    try {
        async.waterfall([
            function (callback) {  // checkReuestValidation
                if (!req.body.stripeToken) {
                    callback({ error: true, message: 'Missing parameter: stripeToken' })
                } else if (!req.body.user_id) {
                    callback({ error: true, message: 'Missing parameter: user_id' })
                } else {
                    callback(null);
                }

            },
            function (callback) {   // checkCustomerExist
                User.findById(req.body.user_id, 'stripe_customerId email')
                    .then(result => {
                        const customer_id = result.stripe_customerId ? result.stripe_customerId : 0;
                        callback(null, customer_id, result)
                    })
                    .catch(err => {
                        callback(err);
                    });
            },
            function (stripe_customerId, data, callback) {   // createCustomer if not at stripe and save id into user table
                if (stripe_customerId === 0) {
                    stripe.customers.create({
                        description: 'Customer for lyrical app with ' + data.email,
                        email: data.email // obtained with Stripe.js
                    })
                        .then(stripeCustomer => {
                            const id = data._id;
                            User.findByIdAndUpdate(id, { 'stripe_customerId': stripeCustomer.id }, { new: true }, function (err, model) {
                                if (err) {
                                    if (err.code && err.code === 11000) {
                                        callback(err.errmsg); // call final function
                                    }
                                }
                                callback(null, stripeCustomer.id);
                            })
                        })
                        .catch(err => {
                            callback(err)
                        })
                } else {
                    callback(null, stripe_customerId)
                }
            },
            function (stripe_customerId, callback) {  // addCard
                addCard(stripe_customerId, req.body.stripeToken, function (error, added_response) {
                    if (error) {
                        callback(error)
                    } else {
                        callback(null, added_response)
                    }
                })
            }
        ], function (err, result) { // final function
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'error occur during stripe card adding',
                    data: err.message || err,
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Card Added successfully',
                data: result
            });

        });
    }
    catch (errorMessage) {
        return res.status(500).json({ "status": false, "error": errorMessage.message || errorMessage })
    }

}

exports.cardList = function (req, res) {
    try {
        if (!req.query.user_id) {
            throw new Error('Missing required query parameter: user_id')
        }
        async.waterfall([
            function (callback) {   // checkCustomerExist
                User.findById(req.query.user_id, 'stripe_customerId email')
                    .then(result => {
                        const customer_id = result.stripe_customerId ? result.stripe_customerId : 0;
                        callback(null, customer_id)
                    })
                    .catch(err => {
                        callback(err);
                    });
            },
            function (stripe_customerId, callback) {   // createCustomer if not at stripe and save id into user table
                if (stripe_customerId === 0) {
                    callback({code: 100, message:'No Card found'})
                } else {
                    stripe.customers.listSources(stripe_customerId, { limit: 5, object: 'card' }, function (err, cards) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, cards)
                        }
                    });
                }
            }
        ], function (err, result) { // final function
            if (err) {
                return res.status(404).json({
                    success: false,
                    message: err.message || err,
                    code: err.code || 101,
                    data: err.message || err
                });
            }
            return res.status(200).json({
                success: true,
                message: 'list successfully fetched',
                code: 200,
                data: result
            });
        });

    } catch (error) {
        return res.status(500).json({ "status": false, "error": error.message || error })
    }
}

exports.createOrder = function (req, res) {
    try {
        async.waterfall([
            function (callback) {  // checkReuestValidation
                if (!req.body.card_id) {
                    callback({ error: true, message: 'Missing parameter: card_id' })
                } else if (!req.body.user_id) {
                    callback({ error: true, message: 'Missing parameter: user_id' })
                } else if (req.body.products.length === 0) {
                    callback({ error: true, message: 'Please add Product' })
                } else if(!req.body.addressId){
                    callback({ error: true, message: 'Missing parameter: addressId' })
                } else {
                    if (!req.body.currency) {
                        req.body['currency'] = "usd"
                    }
                    if (!req.body.description) {
                        req.body['description'] = 'make a payment for your order from lyrical app'
                    }
                    callback(null);
                }
            },
            function (callback) { // checkCustomerExist
                User.findById(req.body.user_id, 'stripe_customerId email')
                    .then(result => {
                        const customer_id = result.stripe_customerId ? result.stripe_customerId : 0;
                        callback(null, customer_id)
                    })
                    .catch(err => {
                        callback(err);
                    });
            },
            function (stripe_customerId, callback) {   // createCustomer if not at stripe and save id into user table
                if (stripe_customerId === 0) {
                    callback('stripe customer id not found for user into User collection')
                } else {
                    callback(null, stripe_customerId)
                }
            },
            function (stripe_customerId, callback) { // makePayment
                var prices = [];
                req.body.products.map((product, key) => {
                    prices.push(parseFloat(product.amount) * parseInt(product.quantity));
                })
                const data = {
                    amount: math.sum(prices) * 100,
                    currency: req.body.currency,
                    customerId: stripe_customerId,
                    cardId: req.body.card_id,
                    description: req.body.description
                }
                createCharge(data, function (error, charge_response) {
                    if (error) {
                        callback(error)
                    } else {
                        callback(null, charge_response)
                    }
                })
            },
            function (charge_response, callback) { // save order into database
                try {
                    var saveProducts = [];
                    async.map(req.body.products,function(prod,mapCallback){
                        var productObject = {};
                        productObject.product_id = sanitize(prod.product_id.trim());
                        productObject.size = sanitize(prod.size.trim());
                        productObject.quantity = parseInt(prod.quantity);
                        productObject.amount = parseInt(prod.amount);
                        saveProducts.push(productObject)
                        mapCallback(null);
                    },function(err){
                        if (err) {
                            callback(err)
                        }
                        var order = new Order();
                        order.user_id = sanitize(req.body.user_id.trim());
                        order.products = saveProducts;
                        order.amount = parseInt(charge_response.amount) / 100;
                        order.shipping_address = sanitize(req.body.addressId.trim());
                        order.invoice_id = sanitize(charge_response.id.trim());
                        order.invoice_status = sanitize(charge_response.status.trim());

                        order.save((err, result) => {
                            if (err) {
                                callback(err); // call final function
                            }
                            callback(null, result) // call final function
                        });
                    })
                } catch (error) {
                    callback(error); // call final function
                }
            },
            function (order, callback) {
                async.map(req.body.products, function (product, map_callback) {
                    Product.findById(product.product_id, { sizes: 1 }, function (err, product_detail) {
                        if (err) {
                            map_callback(err)
                        } else {
                            product_detail.sizes.map((size, key) => {
                                if (size.hasOwnProperty(product.size)) {
                                    const old_quantity = size[product.size];
                                    const updated_quantity = parseInt(old_quantity) - parseInt(product.quantity);
                                    product_detail.sizes[key][product.size] = updated_quantity
                                }
                            });
                            Product.findByIdAndUpdate(product.product_id, product_detail, { new: true }, function (err, model) {
                                if (err) {
                                    if (err.code && err.code === 11000) {
                                        map_callback(err.errmsg); // call final function
                                    }
                                } else {
                                    map_callback(null, order);
                                }
                            })

                        }
                    })
                }, function (err, results) {
                    if (err) {
                        callback(err)
                    } else {
                        callback(null, order)
                    }
                })
            }
        ], function (err, result) { // final function
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'error occur during order creation',
                    data: err.message || err
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Order successfully saved',
                data: result
            });
        });
    } catch (error) {
        return res.status(500).json({ "status": false, "error": error.message || error })
    }
}


exports.createCharge = function (req, res) {
    try {
        async.waterfall([
            function (callback) {  // checkReuestValidation
                if (!req.body.card_id) {
                    callback({ error: true, message: 'Missing parameter: card_id' })
                } else if (!req.body.user_id) {
                    callback({ error: true, message: 'Missing parameter: user_id' })
                } else if (!req.body.amount) {
                    callback({ error: true, message: 'Missing parameter: amount' })
                } else if (!req.body.product_id) {
                    callback({ error: true, message: 'Missing parameter: product_id' })
                } else if (!req.body.size) {
                    callback({ error: true, message: 'Missing parameter: size' })
                } else if (!req.body.quantity) {
                    callback({ error: true, message: 'Missing parameter: quantity' })
                } else {
                    if (!req.body.currency) {
                        req.body['currency'] = "usd"
                    }
                    if (!req.body.description) {
                        req.body['description'] = 'make a payment for your order from lyrical app'
                    }
                    callback(null);
                }
            },
            function (callback) { // checkCustomerExist
                User.findById(req.body.user_id, 'stripe_customerId email')
                    .then(result => {
                        const customer_id = result.stripe_customerId ? result.stripe_customerId : 0;
                        callback(null, customer_id)
                    })
                    .catch(err => {
                        callback(err);
                    });
            },
            function (stripe_customerId, callback) {   // createCustomer if not at stripe and save id into user table
                if (stripe_customerId === 0) {
                    callback('stripe customer id not found for user into User collection')
                } else {
                    callback(null, stripe_customerId)
                }
            },
            function (stripe_customerId, callback) {   // makePayment
                const data = {
                    amount: parseFloat(req.body.amount) * parseInt(req.body.quantity) * 100,
                    currency: req.body.currency,
                    customerId: stripe_customerId,
                    cardId: req.body.card_id,
                    description: req.body.description
                }
                createCharge(data, function (error, charge_response) {
                    if (error) {
                        callback(error)
                    } else {
                        callback(null, charge_response)
                    }
                })
            },
            function (charge_response, callback) { // save order into database
                try {
                    var order = new Order();
                    order.user_id = sanitize(req.body.user_id.trim());
                    order.product_id = sanitize(req.body.product_id.trim());
                    order.size = sanitize(req.body.size.trim());
                    order.quantity = parseInt(req.body.quantity)
                    order.amount = parseInt(charge_response.amount) / 100;
                    order.invoice_id = sanitize(charge_response.id.trim());
                    order.invoice_status = sanitize(charge_response.status.trim());
                    order.save((err, result) => {
                        if (err) {
                            callback(err); // call final function
                        }
                        callback(null, result) // call final function

                    });

                } catch (error) {
                    callback(error); // call final function
                }
            },
            function (order, callback) {
                Product.findById(req.body.product_id, { sizes: 1 }, function (err, product_detail) {
                    if (err) {
                        callback(err)
                    }
                    callback(null, order, product_detail)
                })

            },
            function (order, product_detail, callback) {
                const ordered_size = req.body.size;
                async.eachOfSeries(product_detail.sizes, function (size, iteration, inner_callback) {
                    try {
                        if (size.hasOwnProperty(ordered_size)) {
                            const old_quantity = size[ordered_size];
                            const updated_quantity = parseInt(old_quantity) - parseInt(req.body.quantity)
                            product_detail.sizes[iteration][ordered_size] = updated_quantity
                        }
                        inner_callback(null, inner_callback);
                    } catch (err) {
                        inner_callback(err)
                    }
                },
                    function (err) {
                        if (err) {
                            callback(err)
                        }
                        Product.findByIdAndUpdate(req.body.product_id, product_detail, { new: true }, function (err, model) {
                            if (err) {
                                if (err.code && err.code === 11000) {
                                    callback(err.errmsg); // call final function
                                }
                            }
                            callback(null, order);

                        })
                    });
            }
        ], function (err, result) { // final function
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'error occur during order creation',
                    data: err.message || err
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Order successfully saved',
                data: result
            });
        });
    } catch (error) {
        return res.status(500).json({ "status": false, "error": error.message || error })
    }
}

exports.removeCard = function (req, res) {
    try {
        async.waterfall([
            function (callback) {  // checkReuestValidation
                if (!req.body.card_id) {
                    callback({ error: true, message: 'Missing parameter: card_id' })
                } else if (!req.body.user_id) {
                    callback({ error: true, message: 'Missing parameter: user_id' })
                } else {
                    callback(null);
                }
            },
            function (callback) {   // checkCustomerExist
                User.findById(req.body.user_id, 'stripe_customerId email')
                    .then(result => {
                        const customer_id = result.stripe_customerId ? result.stripe_customerId : 0;
                        callback(null, customer_id)
                    })
                    .catch(err => {
                        callback(err);
                    });
            },
            function (stripe_customerId, callback) {   // createCustomer if not at stripe and save id into user table
                if (stripe_customerId === 0) {
                    callback('stripe customer id not found for user into User collection')
                } else {
                    callback(null, stripe_customerId)
                }
            },
            function (stripe_customerId, callback) {   // remove card
                removeCard(stripe_customerId, req.body.card_id, function (error, removeCrad_res) {
                    if (error) {
                        callback(error)
                    } else {
                        callback(null, removeCrad_res)
                    }
                })
            },
        ], function (err, result) { // final function
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'error occur during remove card',
                    data: err.message || err
                });
            }
            return res.status(200).json({
                success: true,
                message: 'card successfully removed from stripe',
                data: result
            });
        });
    } catch (error) {
        return res.status(500).json({ "status": false, "error": error.message || error })
    }
}

exports.OrderHistory = function (req, res) {
    try {
        const userId = req.query.userId || req.params.userId || req.body.userId;
        if (!userId) {
            throw new Error('Missing Parameter: userId')
        }
        Order.find({user_id: req.query.userId }).populate('shipping_address').populate('products.product_id').exec(function (err, results) {
            if (err) {
                throw err
            } else {
                return res.status(200).json({
                    success: true,
                    data: results
                })
            }
        })
        // .then((results)=>{
        //   if(!results){
        //     throw new Error("No data found")
        //   }else{
        //     return res.status(200).json({
        //       success:true,
        //       data:results
        //     })
        //   }
        // })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || error
        });
    }
}

/*========== Helper Function===============*/
async function create_token(card_detail, callback) {
    try {
        stripe.tokens.create({
            card: card_detail
        })
            .then(token => {
                callback(null, token)
            })
            .catch(error => {
                callback(error)
            })
    } catch (error) {
        callback(error)
    }
}

async function addCard(stripe_customerId, token, callback) {
    try {
        stripe.customers.createSource(
            stripe_customerId,
            { source: token },
            function (err, card) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, card)
                }
            }
        );
    } catch (error) {
        callback(error)
    }
}

async function createCharge(data, callback) {
    try {
        if (!data.amount || !data.currency || !data.customerId || !data.cardId || !data.description) {
            const error = { message: 'Missing required parameter for make a payment' }
            callback(error)
        }
        stripe.charges.create({
            amount: data.amount, // 100 cent  = 1usd
            currency: data.currency,
            customer: data.customerId,
            source: data.cardId, // obtained with Stripe.js
            description: data.description
        }, function (err, charge) {
            if (err) {
                callback(err)
            } else {
                callback(null, charge)
            }
        });
    } catch (error) {
        callback(error)
    }
}

async function removeCard(stripe_customerId, cardId, callback) {
    try {
        stripe.customers.deleteSource(
            stripe_customerId,
            cardId,
            function (err, confirmation) {
                if (err) {
                    callback(err)
                } else {
                    callback(null, confirmation)
                }
            }
        );
    } catch (error) {
        callback(error)
    }
}



/* addCard

if (!req.body.card ) {
 callback({ error: true, message: 'Missing parameter: card object' })
}
if (!req.body.card.number || !req.body.card.exp_month || !req.body.card.exp_year || !req.body.card.cvc) {
 callback({ error: true, message: 'Missing required parameters' })

}
if (!req.body.amount) {
    callback({ error: true, message: 'Missing parameter: amount' })
}
if (!req.body.product_id) {
    callback({ error: true, message: 'Missing parameter: product_id' })
}
if (!req.body.size) {
    callback({ error: true, message: 'Missing parameter: size' })
}
if (!req.body.quantity) {
    callback({ error: true, message: 'Missing parameter: quantity' })
}
if (!req.body.currency) {
    req.body['currency'] = "usd"
}
if (!req.body.description) {
    req.body['description'] = 'make a payment for your order from lyrical app'
}


from water fall
function (stripe_customerId, callback) {  // generate token based on card detail
                // call create_token function
                create_token(req.body.card, function (error, token) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, stripe_customerId, token.id)
                    }
                })

            },

function (stripe_customerId, cardId, callback) {   // makePayment
    const data = {
        amount: parseFloat(req.body.amount) * parseInt(req.body.quantity) * 100,
        currency: req.body.currency ,
        customerId: stripe_customerId,
        cardId: cardId,
        description: req.body.description
    }
    createCharge(data, function(error, charge_response){
        if(error) {
            callback(error)
        } else {
            callback(null, charge_response)
        }
    })
},
function (charge_response, callback) { // save order into database
    try {
            var order = new Order();
            order.user_id = sanitize(req.body.user_id.trim()) ;
            order.product_id = sanitize(req.body.product_id.trim());
            order.size = sanitize(req.body.size.trim());
            order.quantity = parseInt(req.body.quantity)
            order.amount = parseInt(charge_response.amount)/100;
            order.invoice_id = sanitize(charge_response.id.trim());
            order.invoice_status = sanitize(charge_response.status.trim());
            order.save((err, result) => {
                if (err) {
                callback(err); // call final function
                }
                callback(null, result) // call final function

            });
        } catch (error) {
            callback(error); // call final function
        }
},
function (order, callback) {
    Product.findById(req.body.product_id,{sizes: 1}, function (err, product_detail) {
        if (err) {
            callback(err)
        }
        callback(null,order, product_detail )
    })

},
function (order, product_detail, callback) {
    const ordered_size = req.body.size;
    async.eachOfSeries(product_detail.sizes, function(size, iteration, inner_callback){
        if (size.hasOwnProperty(ordered_size)) {
            const old_quantity = size[ordered_size];
            const updated_quantity = parseInt(old_quantity) - parseInt(req.body.quantity)
            product_detail.sizes[iteration][ordered_size] = updated_quantity
        }
        inner_callback(null, inner_callback);
    },
    function(err)
    {
        if (err) {
            callback(err)
        }
        Product.findByIdAndUpdate(req.body.product_id, product_detail, {new: true} , function(err, model) {
        if (err) {
            if (err.code && err.code === 11000) {
            callback(err.errmsg); // call final function
            }
        }
        callback(null, order);

        })
    });


}

*/



