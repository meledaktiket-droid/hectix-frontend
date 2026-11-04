"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type BannerSlide = {
  id: string
  tag: string
  description: string
  imageUrl: string
}

const TWEEN_FACTOR_BASE = 0.5

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

export function FeaturedCarousel({ slides }: { slides: BannerSlide[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const tweenNodes = useRef<HTMLElement[]>([])
  const tweenFactor = useRef(0)
  const autoplay = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  const setTweenNodes = useCallback((emblaApi: NonNullable<CarouselApi>) => {
    tweenNodes.current = emblaApi
      .slideNodes()
      .map((slideNode) => slideNode.querySelector(".coverflow-slide") as HTMLElement)
  }, [])

  const setTweenFactor = useCallback((emblaApi: NonNullable<CarouselApi>) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length
  }, [])

  const tweenScale = useCallback((emblaApi: NonNullable<CarouselApi>, eventName?: string) => {
    const engine = emblaApi.internalEngine()
    const scrollProgress = emblaApi.scrollProgress()
    const slidesInView = emblaApi.slidesInView()
    const isScrollEvent = eventName === "scroll"

    emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress
      const slidesInSnap = engine.slideRegistry[snapIndex]

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target()
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target)
              if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress)
              if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress)
            }
          })
        }

        const tween = clamp(1 - Math.abs(diffToTarget * tweenFactor.current), 0, 1)
        const node = tweenNodes.current[slideIndex]
        if (!node) return
        node.style.transform = `scale(${0.82 + tween * 0.18})`
        node.style.zIndex = `${Math.round(tween * 10)}`
      })
    })
  }, [])

  useEffect(() => {
    if (!api) return

    const onSelect = () => setCurrent(api.selectedScrollSnap())
    const onReInit = () => {
      setTweenNodes(api)
      setTweenFactor(api)
      tweenScale(api)
      onSelect()
    }

    onReInit()
    api.on("select", onSelect)
    api.on("reInit", onReInit)
    api.on("scroll", () => tweenScale(api, "scroll"))
    api.on("slideFocus", () => tweenScale(api))

    return () => {
      api.off("select", onSelect)
      api.off("reInit", onReInit)
    }
  }, [api, setTweenNodes, setTweenFactor, tweenScale])

  if (slides.length === 0) return null

  return (
    <section className="relative z-10 -mt-20">
      <Carousel setApi={setApi} opts={{ loop: true }} plugins={[autoplay.current]} className="relative">
        <CarouselContent className="-ml-3">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="basis-[78%] pl-3 md:basis-[60%]">
              <div className="coverflow-slide relative h-52 overflow-hidden rounded-xl shadow-2xl will-change-transform md:h-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageUrl}
                  alt={slide.tag}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>

      <div className="mt-3 flex justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === current ? "w-4 bg-foreground" : "w-1.5 bg-muted-foreground/40"
            )}
          />
        ))}
      </div>
    </section>
  )
}
