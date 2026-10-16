"use client";

import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { Field, FieldItem, FieldLabel } from "@/components/ui/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { Slider, SliderValue } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { useEffect, useId, useRef, useState } from "react";

export default function Home({ dictionary }) {
    const ffmpegRef = useRef(new FFmpeg());
    const sourceId = useId();
    const customImpulseResponseId = useId();
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [sourceURL, setSourceURL] = useState(null);
    const [outputURL, setOutputURL] = useState(null);
    const [customImpulseResponseSelected, setCustomImpulseResponseSelected] = useState(false);

    useEffect(() => {
        function onLog({ message }) {
            console.log(message);
        }

        async function load() {
            setIsLoading(true);
            const ffmpeg = ffmpegRef.current;

            ffmpeg.on("log", onLog);

            await ffmpeg.load({
                coreURL: "/assets/ffmpeg-core.js",
                wasmURL: "/assets/ffmpeg-core.wasm"
            });

            setLoaded(true);
            setIsLoading(false);
        }

        load();

        return () => {
            ffmpegRef.current.off("log", onLog);
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

        let impulseResponseFile = null;

        switch (impulseResponse) {
            case "concert-hall":
                impulseResponseFile = "/impulse-responses/concert-hall.wav";
                break;
            case "tennis-court":
                impulseResponseFile = "/impulse-responses/tennis-court.wav";
                break;
            case "tower":
                impulseResponseFile = "/impulse-responses/tower.wav";
                break;
            case "auditorium":
                impulseResponseFile = "/impulse-responses/auditorium.wav";
                break;
            case "forest":
                impulseResponseFile = "/impulse-responses/forest.wav";
                break;
            case "custom":
                impulseResponseFile = data.get("customImpulseResponse");
                break;
        }

        await ffmpeg.writeFile("impulse-response.wav", await fetchFile(impulseResponseFile));

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

    return (
        <div className="p-4 flex flex-col gap-4 items-center">
            {loaded ? (
                <>
                    <h1 className="text-lg font-semibold text-center">Audio Reverb</h1>
                    <Form className="w-full max-w-sm flex flex-col gap-4" onSubmit={onSubmit}>
                        <Field>
                            <FieldLabel htmlFor={sourceId}>Input (.mp3)</FieldLabel>
                            <Input type="file" id={sourceId} name="source" accept=".mp3,audio/mpeg" required />
                        </Field>
                        <Field className="gap-2" name="impulseResponse" render={(props) => <Fieldset {...props} />}>
                            <FieldsetLegend className="font-medium text-sm">Impulse response</FieldsetLegend>
                            <RadioGroup defaultValue="concert-hall" onChange={(event) => setCustomImpulseResponseSelected(event.target.value === "custom")}>
                                <FieldItem>
                                    <FieldLabel>
                                        <Radio value="concert-hall" />
                                        Aula konser
                                    </FieldLabel>
                                </FieldItem>
                                <FieldItem>
                                    <FieldLabel>
                                        <Radio value="tennis-court" />
                                        Lapangan tenis
                                    </FieldLabel>
                                </FieldItem>
                                <FieldItem>
                                    <FieldLabel>
                                        <Radio value="tower" />
                                        Menara
                                    </FieldLabel>
                                </FieldItem>
                                <FieldItem>
                                    <FieldLabel>
                                        <Radio value="auditorium" />
                                        Auditorium
                                    </FieldLabel>
                                </FieldItem>
                                <FieldItem>
                                    <FieldLabel>
                                        <Radio value="forest" />
                                        Hutan
                                    </FieldLabel>
                                </FieldItem>
                                <FieldItem>
                                    <FieldLabel>
                                        <Radio value="custom" />
                                        Kustom (.wav)
                                    </FieldLabel>
                                </FieldItem>
                            </RadioGroup>
                        </Field>
                        <Field className={customImpulseResponseSelected ? "" : "hidden"}>
                            <Input type="file" id={customImpulseResponseId} name="customImpulseResponse" accept=".wav,audio/wav" required={customImpulseResponseSelected} />
                        </Field>
                        <Field>
                            <input type="hidden" name="speed" value={speed} />
                            <Slider min={0.5} max={1.5} step={0.025} value={speed} onValueChange={(value) => setSpeed(value)}>
                                <div className="mb-2 flex items-center justify-between gap-1">
                                    <FieldLabel>Kecepatan</FieldLabel>
                                    <SliderValue />
                                </div>
                            </Slider>
                        </Field>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    Memproses...
                                </>
                            ) : "Reverb"}
                        </Button>
                    </Form>
                    <div className="w-full max-w-sm flex flex-col gap-4">
                        {sourceURL && (
                            <div className="flex flex-col gap-2">
                                <span className="font-medium text-sm">Asli</span>
                                <AudioPlayer src={sourceURL} loop downloadable />
                            </div>
                        )}
                        {outputURL && (
                            <div className="flex flex-col gap-2">
                                <span className="font-medium text-sm">Reverb</span>
                                <AudioPlayer src={outputURL} loop downloadable />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <Spinner />
                    <div className="flex flex-col gap-2">
                        <p className="text-center">{dictionary.loading.title}</p>
                        <p className="text-center">{dictionary.loading.message}</p>
                    </div>
                </>
            )}
        </div>
    );
}
