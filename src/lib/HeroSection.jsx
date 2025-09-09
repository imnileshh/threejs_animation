'use client';
import { useState } from 'react';
import AlephScrollScene from '../components/AlephScrollScene';
import StarfieldBackground from '../components/StarfieldBackground';

export default function HeroSection() {
    const [spiralTrigger, setSpiralTrigger] = useState(false);

    return (
        <div className="">
            <StarfieldBackground spiralTrigger={spiralTrigger} />
            <AlephScrollScene setSpiralTrigger={setSpiralTrigger} />

            <div id="new-section" className="hidden">
                {/* Your next section here */}
            </div>
        </div>
        // <section class="py-10 ">
        //     <div class="section__header spacing--large  shop_by_category rich-text md:text-center text-center  ">
        //         <h2 class="rich-text__heading inline-richtext h3">Shop By Category</h2>
        //     </div>
        //     <div class="flex justify-evenly items-center  gap-16 md:gap-20 overflow-hidden  py-3   text-lg md:text-2xl lg:text-3xl font-semibold text-blue-900 ">
        //         <a
        //             href="https://www.provogue.com/collections/luggage"
        //             target="_blank"
        //             class="flex flex-col  items-center  md:gap-8 cursor-pointer "
        //         >
        //             <img
        //                 src="https://www.provogue.com/cdn/shop/files/CopyofLarge_4x-100.webp"
        //                 alt="Luggage"
        //                 class="w-24 h-24 md:w-40 md:h-40 rounded-full object-cover  shadow-lg"
        //             />
        //             <p class=" ">Luggage</p>
        //         </a>

        //         <a
        //             href="https://www.provogue.com/collections/backpack"
        //             target="_blank"
        //             class="flex flex-col  items-center   md:gap-8 cursor-pointer "
        //         >
        //             <img
        //                 src="https://www.provogue.com/cdn/shop/files/Slide1_4x-100_1069917a-d60b-46c3-ab41-6b9fbf1696e4.webp"
        //                 alt="Backpack"
        //                 class="w-24 h-24  md:w-40 md:h-40 rounded-full object-cover shadow-lg  "
        //             />
        //             <p class=" ">Backpack</p>
        //         </a>

        //         <a
        //             href="https://www.provogue.com/collections/backpack"
        //             target="_blank"
        //             class="flex flex-col  items-center   md:gap-8 cursor-pointer "
        //         >
        //             <img
        //                 src="https://www.provogue.com/cdn/shop/files/Slide1_4x-100_1069917a-d60b-46c3-ab41-6b9fbf1696e4.webp"
        //                 alt="Accessories"
        //                 class="w-24 h-24  md:w-40 md:h-40 rounded-full object-cover shadow-lg  "
        //             />
        //             <p class=" ">Accessories</p>
        //         </a>

        //         <a
        //             href="https://www.provogue.com/collections/backpack"
        //             target="_blank"
        //             class="flex flex-col  items-center   md:gap-8 cursor-pointer "
        //         >
        //             <img
        //                 src="https://www.provogue.com/cdn/shop/files/Slide1_4x-100_1069917a-d60b-46c3-ab41-6b9fbf1696e4.webp"
        //                 alt="Customization"
        //                 class="w-24 h-24  md:w-40 md:h-40 rounded-full object-cover shadow-lg  "
        //             />
        //             <p class=" ">Customization</p>
        //         </a>
        //     </div>
        // </section>
    );
}


