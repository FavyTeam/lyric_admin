var sanitize = require("mongo-sanitize");
var User = require("../../models/user");
var shipping_address = require("../../models/shipping_address");

exports.addShippingAddress = async function (req, res) {
    try {
        if (!req.body.user_id) {
            throw "missing Required Parameter : user_id";
        }
        if (!req.body.street) {
            throw "missing Required Parameter : street";
        }
        if (!req.body.street2) {
            req.body.street2 = '';
        }
        if (!req.body.state) {
            throw "missing Required Parameter : state";
        }
        if (!req.body.country) {
            throw "missing Required Parameter : country";
        }
        if (!req.body.city) {
            throw "missing Required Parameter : city";
        }
        if (!req.body.zipCode) {
            throw "missing Required Parameter : zipcode";
        }
        const ShippingAddres = new shipping_address();
        ShippingAddres.user_id = sanitize(req.body.user_id.trim());
        ShippingAddres.street = sanitize(req.body.street.trim());
        ShippingAddres.street2 = sanitize(req.body.street2.trim());
        ShippingAddres.state = sanitize(req.body.state.trim());
        ShippingAddres.city = sanitize(req.body.city.trim());
        ShippingAddres.country = sanitize(req.body.country.trim());
        ShippingAddres.zipCode = sanitize(req.body.zipCode.trim());
        const saved_response = await saveData(ShippingAddres);
        return res.status(200).json({
            success: true,
            message: 'shipping address added successfully.',
            data: saved_response
        })

        // throw 'testing' ;
    } catch (e) {
        return res.status(500).json({ "status": false, "error": e.message || e })
    }
}
// exports.addShippingAddress = async function (req, res) {
//     try {
//             if (!req.body.user_id) {
//                 throw "missing Required Parameter : user_id" ;
//             }
//             if (!req.body.street) {
//                 throw "missing Required Parameter : street" ;
//             }
//             if (!req.body.state1) {
//                 throw "missing Required Parameter : state1" ;
//             }
//             if (!req.body.country) {
//                 throw "missing Required Parameter : country" ; 
//             }
//             if (!req.body.state2) {
//                 req.body.state2 = '' ;
//             }


//             const ShippingAddres = new shipping_address() ;
//             ShippingAddres.user_id = sanitize(req.body.user_id.trim()) ;
//             ShippingAddres.street = sanitize(req.body.street.trim());
//             ShippingAddres.state1 = sanitize(req.body.state1.trim());
//             ShippingAddres.state2 = sanitize(req.body.state2.trim());
//             ShippingAddres.country = sanitize(req.body.country.trim());
//             const saved_response = await saveData(ShippingAddres);
//             return res.status(200).json({
//                 success: true,
//                 message: 'shipping address added successfully.',
//                 data: saved_response
//             })

//         // throw 'testing' ;
//     } catch (e) {
//         return res.status(500).json({"status": false, "error": e.message || e })
//     }
// }

exports.getShippingAddress = async function (req, res) {
    try {
        if (!req.query.user_id) {
            throw "missing Required Parameter : user_id";
        }
        const query = shipping_address.
            find({ user_id: req.query.user_id }).
            populate('user_id');
        const response = await executeQuery(query);
        return res.status(200).json({
            success: true,
            message: 'shipping address fetched successfully.',
            data: response
        });

    } catch (e) {
        return res.status(500).json({ "status": false, "error": e.message || e })
    }
}
exports.removeShippingAddress = async function (req, res) {
    try {
        if (!req.query.address_id) {
            throw "missing Required Parameter : address_id";
        }
        const query = shipping_address.
            findOneAndRemove({ _id: req.query.address_id });
        const response = await executeQuery(query);
        return res.status(200).json({
            success: true,
            message: 'shipping address deleted successfully.',
            data: response
        })
    } catch (e) {
        return res.status(500).json({ "status": false, "error": e.message || e })
    }
}

//----------------- Helper -----------------------//
async function saveData(model) {
    return new Promise((resolve, reject) => {
        try {
            model.save((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result)
                }
            });
        } catch (error) {
            reject(error)
        }
    });
}

async function executeQuery(query) {
    return new Promise((resolve, reject) => {
        try {
            query.exec(function (err, result) {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        } catch (e) {
            reject(e);
        }
    });
}
