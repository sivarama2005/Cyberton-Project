import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const RewardContext = createContext();

export const useReward = () => {
    return useContext(RewardContext);
};

export const RewardProvider = ({ children }) => {
    const { user } = useAuth();
    
    // Reward Status State
    const [rewardStatus, setRewardStatus] = useState(null);
    const [availablePoints, setAvailablePoints] = useState(0);

    // Coupon & Checkout State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponError, setCouponError] = useState('');
    const [usePoints, setUsePoints] = useState(false);

    // Fetch rewards from backend
    const fetchRewards = async () => {
        if (!user) return;
        try {
            const response = await api.get('/rewards/status');
            setRewardStatus(response.data);
            setAvailablePoints(response.data.loyaltyPoints || 0);
        } catch (error) {
            console.error("Failed to fetch rewards", error);
        }
    };

    useEffect(() => {
        fetchRewards();
    }, [user]);

    const claimReward = async () => {
        try {
            const response = await api.post('/rewards/claim-login');
            setRewardStatus(prev => ({
                ...prev,
                loyaltyPoints: response.data.newTotal,
                loginStreak: response.data.currentStreak,
                claimedToday: true
            }));
            setAvailablePoints(response.data.newTotal);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    const handleValidateCoupon = async (code, orderTotal) => {
        setCouponError('');
        try {
            const res = await api.post('/coupons/validate', { code, orderTotal });
            setAppliedCoupon(res.data.code);
            setCouponDiscount(res.data.discountAmount);
            return res.data;
        } catch (error) {
            const msg = error.response?.data?.message || 'Invalid coupon';
            setCouponError(msg);
            setAppliedCoupon(null);
            setCouponDiscount(0);
            throw error;
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponDiscount(0);
        setCouponError('');
    };

    const value = {
        rewardStatus,
        availablePoints,
        fetchRewards,
        claimReward,
        couponCode,
        setCouponCode,
        appliedCoupon,
        setAppliedCoupon,
        couponDiscount,
        setCouponDiscount,
        couponError,
        setCouponError,
        handleValidateCoupon,
        removeCoupon,
        usePoints,
        setUsePoints
    };

    return (
        <RewardContext.Provider value={value}>
            {children}
        </RewardContext.Provider>
    );
};
