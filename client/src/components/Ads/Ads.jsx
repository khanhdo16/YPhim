import './Ads.css'
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

const AAds = ({ items }) => {
    const AdTemplate = ({ id }) => {
        return <iframe title={id} className='qc__aa__banner' data-aa={id} src={'//acceptable.a-ads.com/' + id + '?size=Adaptive&background_color=272727'}></iframe>;
    }

    const banners = items.map(item => {
        return <AdTemplate key={item} id={item} />
    })

    return (
        <div className='qc__aa'>
            {banners}
        </div>
    )
}

const OtherAds = () => {
    return (
        <>
            <Helmet>
                <script async='async' src='https://www.googletagservices.com/tag/js/gpt.js'></script>
                <script type="text/javascript">{`var googletag = googletag || {cmd: []};`}</script>
                <script type="text/javascript">{
                    `googletag.cmd.push(function() {
                        googletag.defineSlot('/25379366/22713035437', ['fluid'], 'yphim.com_22966_fluid_624d05d4975d1').addService(googletag.pubads());
                        googletag.pubads().enableSingleRequest();
                        googletag.pubads().collapseEmptyDivs();
                        googletag.enableServices();
                    });
                    
                    googletag.cmd.push(function() { googletag.display('yphim.com_22966_fluid_624d05d4975d1'); });`
                }</script>
            </Helmet>
            <div className='qc__aa'>
                <div className='qc__aa__banner' id="yphim.com_22966_fluid_624d05d4975d1" />
            </div>
        </>
    )
}

const Banner = ({ items }) => {
    const BannerTemplate = ({ banner }) => {
        const { image, url } = banner || {};

        if (image && url)
            return (
                <a className='qc__cus__banner' href={url}>
                    <img src={image} alt='' />
                </a>
            )

        return <></>
    }

    const banner = items.map((item, index) => {
        return <BannerTemplate key={index} banner={item} />
    })

    return banner
}

const AdsContainer = ({ ads }) => {
    const [loaded, setLoaded] = useState(false);

    const {
        banner1, banner2, aads1, aads2, aads3
    } = ads || {};

    const options = {
        style: { opacity: loaded ? undefined : 0 },
        onLoad: () => setLoaded(true),
    }

    return (
        <div id='qc' {...options}>
            <AAds items={[aads1, aads2, aads3]} />
            <Banner items={[banner1, banner2]} />
            <OtherAds />
        </div>
    )
}

export const Ads = () => {
    const [ads, setAds] = useState();

    const getAds = async () => {
        try {
            const res = await fetch('/api/ads')
            const ads = res.status === 200 ? await res.json() : null;
            if (ads) setAds(ads);
        }
        catch (err) {
            if (process.env.DEBUG) console.log(err)
        }
    }

    useEffect(() => getAds(), []) //eslint-disable-next-line

    const adBanner = useMemo(() => {
        if (ads) return <AdsContainer ads={ads} />
        else return <></>
    }, [ads])

    return adBanner
}