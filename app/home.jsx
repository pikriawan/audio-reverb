"use client";

import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider, SliderValue } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export default function Home() {
    const ffmpegRef = useRef(new FFmpeg());
    const impulseResponseRef = useRef(null);
    const sourceId = useId();
    const impulseResponseId = useId();
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [sourceURL, setSourceURL] = useState(null);
    const [outputURL, setOutputURL] = useState(null);
    const [impulseResponseFilled, setImpulseResponseFilled] = useState(false);

    useEffect(() => {
        function onLog({ message }) {
            console.log(message);
        }

        function onProgress({ progress }) {
            console.log(`progress: ${progress}`);
        }

        async function load() {
            setIsLoading(true);

            const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
            const ffmpeg = ffmpegRef.current;

            ffmpeg.on("log", onLog);
            ffmpeg.on("progress", onProgress);

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm")
            });

            setLoaded(true);
            setIsLoading(false);
        }

        load();

        return () => {
            ffmpegRef.current.off("log", onLog);
            ffmpegRef.current.off("progress", onProgress);
        };
    }, []);

    async function onSubmit(event) {
        event.preventDefault();

        if (!loaded || isLoading) {
            return;
        }

        const data = new FormData(event.target);
        const source = data.get("source");
        const impulseResponse = data.get("impulseResponse");
        const speed = data.get("speed");

        setIsLoading(true);

        const ffmpeg = ffmpegRef.current;

        await ffmpeg.writeFile("source.mp3", await fetchFile(source));
        await ffmpeg.writeFile("impulse-response.wav", await fetchFile(impulseResponse.size > 0 ? impulseResponse : "/impulse-response.wav"));

        await ffmpeg.exec([
            "-i",
            "source.mp3",
            "-i",
            "impulse-response.wav",
            "-filter_complex",
            `[0:a][1:a]afir,asetrate=44100*${speed},aresample=44100,volume=10`,
            "-c:a",
            "libmp3lame",
            "-b:a",
            "320k",
            "output.mp3"
        ]);

        setIsLoading(false);

        if (sourceURL) {
            URL.revokeObjectURL(sourceURL);
        }

        setSourceURL(URL.createObjectURL(source));

        if (outputURL) {
            URL.revokeObjectURL(outputURL);
        }

        const outputData = await ffmpeg.readFile("output.mp3");
        setOutputURL(URL.createObjectURL(new Blob([outputData.buffer], { type: "audio/mpeg" })));
    }

    function onImpulseResponseChange(event) {
        if (event.target.files) {
            setImpulseResponseFilled(true);
        }
    }

    function resetImpulseResponse() {
        if (!impulseResponseRef.current) {
            return;
        }

        impulseResponseRef.current.value = "";
        setImpulseResponseFilled(false);
    }

    return (
        <div className="p-4 flex flex-col gap-4 items-center">
            {loaded ? (
                <>
                    <h1 className="text-lg font-semibold text-center">Convolver</h1>
                    <Form className="w-full max-w-sm flex flex-col gap-4" onSubmit={onSubmit}>
                        <Field>
                            <FieldLabel htmlFor={sourceId}>Source (.mp3)</FieldLabel>
                            <Input type="file" id={sourceId} name="source" accept=".mp3,audio/mpeg" required />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor={impulseResponseId}>Impulse response (.wav, optional)</FieldLabel>
                            <div className="w-full flex gap-2">
                                <Input type="file" id={impulseResponseId} name="impulseResponse" accept=".wav,audio/wav" onChange={onImpulseResponseChange} ref={impulseResponseRef} />
                                <Button variant="ghost" onClick={resetImpulseResponse} disabled={!impulseResponseFilled}>
                                    <RotateCcw />
                                </Button>
                            </div>
                        </Field>
                        <Field>
                            <input type="hidden" name="speed" value={speed} />
                            <Slider min={0.5} max={1.5} step={0.025} value={speed} onValueChange={(value) => setSpeed(value)}>
                                <div className="mb-2 flex items-center justify-between gap-1">
                                    <FieldLabel>Speed</FieldLabel>
                                    <SliderValue />
                                </div>
                            </Slider>
                        </Field>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    Processing...
                                </>
                            ) : "Convolve"}
                        </Button>
                    </Form>
                    <div className="w-full max-w-sm flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span>Original</span>
                            <AudioPlayer src={sourceURL} loop downloadable />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span>Convolved</span>
                            <AudioPlayer src={outputURL} loop downloadable />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <Spinner />
                    <div className="flex flex-col gap-2">
                        <p className="text-center">Loading ffmpeg</p>
                        <p className="text-center">This might take a while</p>
                    </div>
                </>
            )}
        </div>
    );
}
