import { useState, useEffect } from 'react';
import { MOCK_REVIEWS } from '../../../shared/utils/mockData';
import { adaptReviewData } from '../services/facultyAdapter';
import { isDeadlinePassed, isReviewActive } from '../../../shared/utils/dateHelpers';

export const useFacultyReviews = (facultyId = 'FAC_001') => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // Use mock data
                const adaptedReviews = MOCK_REVIEWS.map(adaptReviewData);
                setReviews(adaptedReviews);
                setError(null);
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setError('Failed to load reviews');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [facultyId]);

    // Helper to check if a team is fully marked
    const isAllTeamsMarked = (review) => {
        return review.teams?.length > 0 && review.teams.every(team => team.marksEntered);
    };

    // Derived state: Categorize reviews
    const active = reviews.filter(r => isReviewActive(r.startDate, r.endDate) && !isAllTeamsMarked(r));

    const deadlinePassed = reviews.filter(r =>
        isDeadlinePassed(r.endDate) && !isAllTeamsMarked(r)
    );

    const past = reviews.filter(r =>
        isAllTeamsMarked(r) || (isDeadlinePassed(r.endDate) && isAllTeamsMarked(r))
    );

    return {
        reviews,
        active,
        deadlinePassed,
        past,
        loading,
        error,
        refreshReviews: () => { /* re-fetch logic could go here */ }
    };
};
