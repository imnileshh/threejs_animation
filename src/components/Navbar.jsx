'use client';

import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Helper array for navigation links to keep the code clean
    const navLinks = [
        { href: '#home', label: 'Home' },
        { href: '#about', label: 'About' },
        { href: '#contact', label: 'Contact' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 w-full bg-transparent  p-6 z-50">
                <nav className="max-w-7xl mx-auto flex justify-between items-center">
                    <a href="#" className="text-2xl font-bold z-50">
                        <span className="text-purple-600">SAAA</span>
                        <span className="text-zinc-800"> consultants</span>
                    </a>

                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-zinc-600 hover:text-purple-600 transition-colors duration-300"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <button className="hidden md:block bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors duration-300 ease-in-out">
                        Let's Connect
                    </button>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-zinc-800 z-50"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </nav>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`md:hidden fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col items-center justify-center h-full space-y-10">
                    {navLinks.map(link => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-2xl text-zinc-800 hover:text-purple-600"
                            onClick={() => setIsMenuOpen(false)} // Close menu on link click
                        >
                            {link.label}
                        </a>
                    ))}
                    <button className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold text-lg">
                        Let's Connect
                    </button>
                </div>
            </div>
        </>
    );
};

export default Navbar;
