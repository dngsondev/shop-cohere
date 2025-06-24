import React from "react";

export default function RatingStars({ rating = 0 }) {
    const rounded = Math.round(rating * 2) / 2;
    return (
        <div className="rating-stars flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <span
                    key={i}
                    className="star"
                    style={{
                        color: "#facc15",
                        fontSize: "1.1em",
                        lineHeight: 1,
                        display: "inline-block",
                    }}
                >
                    {rounded >= i
                        ? "★"
                        : rounded >= i - 0.5
                            ? "☆"
                            : "☆"}
                </span>
            ))}
            <span className="score ml-1 font-semibold text-yellow-600 text-sm">
                {rating % 1 === 0 ? rating : rating.toFixed(1)}
            </span>
        </div>
    );
}