const Coupon = require("../modals/Coupon");

class CouponController {
    static async createCoupn(req, res, next) {
        const { code, expirationDate, discountValue, offerId } = req.body;

        // Basic validation
        if (!code || !expirationDate || discountValue === undefined) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        try {
            // Create a new coupon instance
            const newCoupon = new Coupon({
                code,
                expirationDate: new Date(expirationDate), // Convert to Date object
                discountValue,
                ...(offerId && { offerId: offerId }),
            });

            // Save the coupon to the database
            await newCoupon.save();

            // Respond with the created coupon
            return res.status(201).json({ message: 'Coupon created successfully!', coupon: newCoupon });

        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Coupon code must be unique.' });
            }
            console.error(error);
            return res.status(500).json({ message: 'Server error. Please try again later.' });
        }
    }
    static async applyCoupon(req, res, next){
        const { couponCode, userId } = req.body;

        try {
          // Find the coupon by its code in the database
          const coupon = await Coupon.findOne({ code: couponCode });
      
          // Case 1: Invalid coupon (coupon not found)
          if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon.' });
          }
      
          // Case 2: Coupon is expired
          const today = new Date();
          const expirationDate = new Date(coupon.expirationDate);
          if (expirationDate < today) {
            return res.status(400).json({ message: 'This coupon is expired.' });
          }
      
          // Case 3: Coupon already applied by this user
          if (coupon.usersApplied.includes(userId)) {
            return res.status(400).json({ message: 'Coupon already applied.' });
          }
      
          // Case 4: Apply the coupon (update the database)
      
      
          // Return success with the discount value
          return res.status(200).json({ message: 'Coupon applied successfully!', discountValue: coupon.discountValue });
      
        } catch (error) {
          // Handle any errors (e.g., database issues)
          console.error(error);
          return res.status(500).json({ message: 'Server error. Please try again later.' });
        }
    }
}

module.exports=CouponController