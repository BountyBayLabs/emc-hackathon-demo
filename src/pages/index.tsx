import React, { useEffect, useState } from "react";
import { trpc } from '@/utils/trpc';
import { ProductTitleAndDescription } from "@/types/product";
import Link from "next/link";
import Image from "next/image";
import { NextUIProvider } from "@nextui-org/react";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";

import '@/app/globals.css'

const Home = () => {
  const AI_GENERATING = "AI generating ..."

  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [imageB64, setImageB64] = useState<string>("")
  const [navText, setNavText] = useState<string>("")

  const [productCategory, setProductCategory] = useState<string>("")
  const [productKeywords, setProductKeywords] = useState<string[]>([])
  const [productTitle, setProductTitle] = useState<string>("")
  const [productDescription, setProductDescription] = useState<string>("")

  const [targetLanguage, setTargetLanguage] = React.useState(new Set(["English"]));

  const selectedLanguage = React.useMemo(
    () => Array.from(targetLanguage).join(", ").replaceAll("_", " "),
    [targetLanguage]
  );

  const parseImage = trpc.parseProductImage.useMutation()
  const apictx = trpc.useUtils()

  function blobToBase64(blob: Blob | null) {
    return new Promise((resolve, _) => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const path = reader.result as string
          setImageB64(path.split("base64,")[1]);
        }
        reader.readAsDataURL(blob);
      }
    });
  }

  useEffect(() => {
    if (selectedImage) {
      void blobToBase64(selectedImage as Blob | null)
      setImageUrl(URL.createObjectURL(selectedImage))
      setProductCategory(AI_GENERATING)
      setProductKeywords([])
      setProductTitle(AI_GENERATING)
      setProductDescription(AI_GENERATING)
      setNavText("Back")
    } else {
      setNavText("")
    }
  }, [selectedImage])

  useEffect(() => {
    if (imageB64.length > 0) {
      void parseImage.mutate({ imageB64: imageB64 }, {
        onSuccess: (out) => {
          setProductCategory(out.category)
          setProductKeywords(out.keywords)
        },
        onError: (err) => {
          setProductCategory("Unknown")
          setProductTitle("Something went wrong")
          setProductDescription("Something went wrong")
        }
      })
    }
  }, [imageB64])

  const generate = () => {
    if (productCategory !== AI_GENERATING && productCategory.length > 0 && productKeywords.length > 0) {
      void apictx.generateTitleAndDescription.fetch({
        language: selectedLanguage,
        category: productCategory,
        keywords: productKeywords
      }).then((out: ProductTitleAndDescription) => {
        setProductTitle(out.title)
        setProductDescription(out.description)
      }).catch((e) => {
        setProductTitle("Something went wrong")
        setProductDescription("Something went wrong")
      })
    }
  }

  useEffect(() => {
    generate()
  }, [productCategory, productKeywords])

  const cleanUp = () => {
    setSelectedImage(null)
    setImageUrl("")
    setImageB64("")
    setProductCategory("")
    setProductKeywords([])
    setProductTitle("")
    setProductDescription("")
  }

  const regenerate = () => {
    setProductTitle(AI_GENERATING)
    setProductDescription(AI_GENERATING)
    generate()
  }

  const isProcessing = () => {
    return productDescription === AI_GENERATING
  }

  return (
  <NextUIProvider>
    <div className={`mx-auto flex min-h-screen max-w-3xl flex-col bg-gray-100 round-lg bg-[url("/check-in-bg.png")] bg-cover bg-center bg-no-repeat`}>
      <header className="mx-auto h-full w-full flex-none">
        <div className="container mx-auto flex w-full max-w-3xl items-center justify-between pb-4 pt-5">
          <div className="flex w-full items-center justify-between md:block">
            <Link href={"/"} onClick={cleanUp}>
              <Image
                className="float-left mr-2 mt-1.5"
                src="/back-arrow.png"
                width={15}
                height={15}
                alt="back-arrow"
              />
              <p className="float-left text-base font-semibold subpixel-antialiased">{navText}</p>
            </Link>
          </div>
        </div>
      </header>
      <div className="container mx-auto h-full w-full max-w-3xl pl-5 pr-5">
        {selectedImage && (
          <div>
            <div className="rounded-lg bg-white p-3">
              <div>
                <div className="float-left w-1/3">
                  <img alt="product image" width={120} height={120} src={imageUrl} className="rounded-lg" />
                </div>
                <div className="float-left w-2/3">
                  <div className="ml-3">
                    <p className="text-pretty mb-1 font-bold">{productTitle}</p>
                    <div className="float-left mr-1 mt-1 rounded-full bg-gray-500 pl-2 pr-2 text-xs text-white">{productCategory}</div>
                    <p className="clear-both pt-2 text-xs text-gray-500">by Special Guest</p>
                    <div className="flex flex-row pt-1">
                      <div className="mr-2 font-bold">$123</div>
                      <div className="mt-1 text-xs line-through">$456</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="clear-both mb-2 border-b border-gray-300 py-2 border-gray-300"></div>
              <div>
                <p className="font-bold pb-2">Product Introduction</p>
                <article className="text-pretty prose prose-sm">
                  {productDescription.split("\n").map((line) => {
                    return (<p>{line}</p>)
                  })}
                </article>
              </div>
            </div>
            {!isProcessing() && (
              <div className="mt-3 flex justify-center text-sm font-bold text-[#382173] underline cursor-pointer" onClick={() => regenerate()}>
                Re-generate
              </div>
            )}
            <div className="sticky mt-8 mb-8 w-full">
              {isProcessing() && (
                <button className="w-full rounded-full bg-violet-900 pb-4 pt-4 font-bold text-white">
                  <div className="flex justify-center space-x-3">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p>Processing ...</p>
                  </div>
                </button>
              )}
              {!isProcessing() && (
                <button className="w-full rounded-full bg-violet-900 pb-4 pt-4 font-bold text-white" onClick={() => {
                  window.open("https://t.me/bountybay_bot", "Bounty Bay Bot on Telegram")
                }}>Sell on Bounty Bay</button>
              )}
            </div>
            <div className="grid place-content-center mt-10 mb-10">
              <Link href={"https://t.me/bountybay_bot"}>
                <Image className="" src="/bby-logo.png" width={80} height={80} alt="bby-logo"></Image>
              </Link>
              <Link href={"https://emchub.ai/"} className="text-gray-500 mt-2 ml-[-1em] text-sm">
                powered by EMC
              </Link>
            </div>
          </div>
        )}
        {!selectedImage && (
          <div>
            <div className="text-[28px] font-extrabold">
              <p className="text-[#654CA8]">List Product on BBY to</p>
              <p className="bg-gradient-to-r from-[#551BED] to-[#9B7AF9] bg-clip-text text-transparent">Earn Special Rewards!</p>
            </div>
            <div className="mt-4">
              <div className="mt-2 rounded-lg bg-white px-2 py-1 bg-gradient-to-r from-[#FFEFD1] to-[#FFF]">
                <div className="px-1 py-1">
                  <div className="flex items-center">
                    <div className="text-sm font-bold">Upload a product photo to start listing</div>
                  </div>
                  <div className="text-xs text-slate-400">the photo should be in the format of PNG, JPEG, WEBP, or GIF</div>
                </div>
              </div>
              <div className="mt-2 rounded-lg px-2 py-1 bg-[#FFF]">
                <div className="px-1 py-1">
                  <div className="flex items-center">
                    <div className="text-sm font-bold">Choose a language for the product title and description</div>
                  </div>
                  <div className="mt-2">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button 
                          variant="bordered" 
                          className="capitalize"
                        >
                          {selectedLanguage}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu 
                          aria-label="Single selection example"
                          variant="flat"
                          disallowEmptySelection
                          selectionMode="single"
                          selectedKeys={targetLanguage}
                          onSelectionChange={(e) => {
                            setTargetLanguage(e as Set<string>)
                          }}>
                        <DropdownItem key="English">English</DropdownItem>
                        <DropdownItem key="Simplified_Chinese">Simplified Chinese</DropdownItem>
                        <DropdownItem key="Traditional_Chinese">Traditional Chinese</DropdownItem>
                        <DropdownItem key="Russian">Russian</DropdownItem>
                        <DropdownItem key="Indonesian">Indonesian</DropdownItem>
                        <DropdownItem key="Malay">Malay</DropdownItem>
                        <DropdownItem key="Thai">Thai</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky mt-8 w-full">
              <input
                type="file"
                name="productImage"
                className="block w-full text-sm text-gray-500
                file:me-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-900 file:text-white
                hover:file:bg-violet-500
                file:disabled:opacity-50 file:disabled:pointer-events-none"
                onChange={(event: any) => {
                  setSelectedImage(event.target.files[0]);
                }}
              />
            </div>
            <div className="grid place-content-center mt-20">
              <Link href={"https://t.me/bountybay_bot"}>
                <Image className="" src="/bby-logo.png" width={80} height={80} alt="bby-logo"></Image>
              </Link>
              <Link href={"https://emchub.ai/"} className="text-gray-500 mt-2 ml-[-1em] text-sm">
                powered by EMC
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  </NextUIProvider>
  );
};

export default Home;
