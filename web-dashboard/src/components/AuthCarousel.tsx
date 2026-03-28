'use client';

import { useState, useEffect } from 'react';
import { Wheat, User, Leaf } from 'lucide-react';

const slides = [
  {
    image: '/login-bg.png',
    quote: "Agro-Connect has completely transformed how I manage my farm's supply chain and crop yields.",
    author: "Elias Robertson",
    role: "Organic Wheat Farmer",
    icon: Wheat,
  },
  {
    image: '/login-bg-2.png',
    quote: "The predictive analytics saved us countless hours of manual planning this harvest season.",
    author: "Sarah Jenkins",
    role: "Agricultural Operations Manager",
    icon: Leaf,
  },
  {
    image: '/login-bg-3.png',
    quote: "A seamless experience from planting to delivery. Best investment for our smart farm.",
    author: "Mateo Garcia",
    role: "Smart Farm Director",
    icon: User,
  }
];

export default function AuthCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000); // 5 seconds interval
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auth-image-section">
      {slides.map((slide, index) => {
        const Icon = slide.icon;
        return (
          <div
            key={index}
            className={`auth-carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            <div className="auth-image-overlay">
              <div className="auth-testimonial-wrapper">
                <div className="auth-testimonial compact">
                  <div className="quote-icon-container"><Icon size={24} /></div>
                  <blockquote>"{slide.quote}"</blockquote>
                  <div className="testimonial-author">
                    <strong>{slide.author}</strong>
                    <span>{slide.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
