// src/components/pages/ScanQRcode.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckInStore } from "@/store/checkin-store";
import { toastService } from "@/lib/toast";
import { alertService } from "@/lib/sweetalert";
import { ErrorHandler } from "@/lib/error-handler";
import { QrCode, Loader2, RotateCcw, Calendar, CalendarDays } from "lucide-react";
import jsQR from "jsqr";

export default function ScanQRcode() {
    const navigate = useNavigate();
    const { checkInParticipant, checkInParticipantMultiDay, isLoading } =
        useCheckInStore();

    const [isScanning, setIsScanning] = useState(false);
    const [manualInput, setManualInput] = useState("");
    const [lastScannedCode, setLastScannedCode] = useState<string>("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Event type selection
    const [eventType, setEventType] = useState<"single" | "multi" | null>(null);
    const [selectedDay, setSelectedDay] = useState<string>("");
    const maxDay = 10; // Changed to const since we don't need to update it
    const [customDay, setCustomDay] = useState<string>("");
    const [showCustomInput, setShowCustomInput] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start camera when event type is selected
    useEffect(() => {
        if (eventType) {
            startCamera();
        }
        return () => stopCamera();
    }, [eventType]);

    // Resume scanning when day is selected for multi-day events
    useEffect(() => {
        if (eventType === "multi" && selectedDay && streamRef.current) {
            console.log("Day selected, starting scanner for day:", selectedDay);
            setIsScanning(true);
            toastService.success(`Ready to scan for Day ${selectedDay}`);
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
            scanIntervalRef.current = setInterval(scanQRCode, 300);
        }
    }, [selectedDay]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // For multi-day events, only start scanning if day is selected
                if (eventType === "single") {
                    setIsScanning(true);
                    toastService.success("Camera started. Point at QR code...");
                    scanIntervalRef.current = setInterval(scanQRCode, 300);
                } else if (eventType === "multi") {
                    toastService.success("Camera ready. Select a day to start scanning.");
                    // Don't start scanning yet - wait for day selection
                }
            }
        } catch (error) {
            alertService.error(
                "Camera Access Denied",
                "Please allow camera access in your browser settings to scan QR codes."
            );
        }
    };

    const scanQRCode = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (video.readyState !== video.HAVE_ENOUGH_DATA || !ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code && code.data) {
                if (code.data !== lastScannedCode) {
                    setLastScannedCode(code.data);
                    handleQRCodeDetected(code.data);
                }
            }
        } catch (error) {
            // Continue scanning
        }
    };

    const extractParticipantId = (qrData: string): string | null => {
        // Format 1: participant:ID:EVENT_ID
        if (qrData.includes(":")) {
            const parts = qrData.split(":");
            if (parts[0] === "participant" && parts.length >= 3) {
                return parts[1];
            }
        }

        // Format 2: Just the participant ID directly
        if (qrData && qrData.length > 10 && /^[a-zA-Z0-9]+$/.test(qrData)) {
            return qrData;
        }

        return null;
    };

    const handleQRCodeDetected = async (qrData: string) => {
        try {
            const participantId = extractParticipantId(qrData);

            if (!participantId) {
                // Invalid format - keep scanning silently
                return;
            }

            // Prevent duplicate processing
            if (processingId === participantId) {
                return;
            }

            // Stop scanning during processing
            pauseScanning();
            setProcessingId(participantId);

            // Check in based on event type
            if (eventType === "single") {
                await performSingleDayCheckIn(participantId);
            } else if (eventType === "multi") {
                if (!selectedDay) {
                    toastService.warning("Please select a day before scanning");
                    resumeScanning();
                    return;
                }
                const day = parseInt(selectedDay, 10);
                await performMultiDayCheckIn(participantId, day);
            }
        } catch (error) {
            console.error("Error processing QR code:", error);
            resumeScanning();
        } finally {
            setProcessingId(null);
        }
    };

    const performSingleDayCheckIn = async (participantId: string) => {
        try {
            const loadingToast = toastService.loading("Processing check-in...");

            const result = await checkInParticipant(participantId);

            toastService.dismiss(loadingToast);

            if (result.success) {
                const participantName = result.participant?.name || "Participant";
                await alertService.success(
                    "Check-in Successful!",
                    `${participantName}, you have been successfully checked in. Welcome to the event!`
                );

                // Pause for 2 seconds before resuming
                setLastScannedCode("");
                setTimeout(() => {
                    resumeScanning();
                }, 2000);
            } else {
                // Handle error cases
                if (result.error?.toLowerCase().includes("already checked in")) {
                    const participantName = result.participant?.name || "You";
                    await alertService.info(
                        "Already Checked In",
                        `${participantName}, you have already been checked in for this event.`
                    );
                } else if (result.error?.toLowerCase().includes("not found")) {
                    await alertService.error(
                        "Participant Not Found",
                        "Your registration could not be found. Please contact event organizers."
                    );
                } else {
                    ErrorHandler.showError(result.error);
                }
                resumeScanning();
            }
        } catch (error) {
            ErrorHandler.showError(error);
            resumeScanning();
        }
    };

    const performMultiDayCheckIn = async (participantId: string, day: number) => {
        try {
            const loadingToast = toastService.loading(`Checking in for Day ${day}...`);

            const result = await checkInParticipantMultiDay(participantId, day);

            toastService.dismiss(loadingToast);

            if (result.success) {
                const participantName = result.participant?.name || "Participant";
                await alertService.success(
                    "Check-in Successful!",
                    `${participantName}, you have been successfully checked in for Day ${day}. Welcome!`
                );

                // Pause for 2 seconds before resuming
                setLastScannedCode("");
                setTimeout(() => {
                    resumeScanning();
                }, 2000);
            } else {
                // Handle error cases
                if (result.error?.toLowerCase().includes("already checked in")) {
                    const participantName = result.participant?.name || "You";
                    alertService.info(
                        "Already Checked In",
                        `${participantName} have already been checked in for Day ${day}.`
                    );
                } else if (result.error?.toLowerCase().includes("past day")) {
                    alertService.warning(
                        "Past Day",
                        "You cannot check in for a past day. Please select a current or future day."
                    );
                } else if (result.error?.toLowerCase().includes("invalid day")) {
                    alertService.error("Invalid Day", result.error);
                } else {
                    ErrorHandler.showError(result.error);
                }
                resumeScanning();
            }
        } catch (error) {
            ErrorHandler.showError(error);
            resumeScanning();
        }
    };

    const pauseScanning = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        setIsScanning(false);
    };

    const resumeScanning = () => {
        if (videoRef.current && streamRef.current && eventType) {
            // For multi-day events, check if day is selected
            if (eventType === "multi" && !selectedDay) {
                return;
            }

            setLastScannedCode("");
            setProcessingId(null);
            setIsScanning(true);
            scanIntervalRef.current = setInterval(scanQRCode, 300);
        }
    };

    const handleManualCheckIn = async () => {
        if (!manualInput.trim()) {
            toastService.warning("Please enter a participant ID");
            return;
        }

        if (eventType === "multi" && !selectedDay) {
            toastService.warning("Please select a day for multi-day check-in");
            return;
        }

        pauseScanning();
        const participantId = manualInput.trim();

        if (eventType === "single") {
            await performSingleDayCheckIn(participantId);
        } else if (eventType === "multi") {
            const day = parseInt(selectedDay, 10);
            await performMultiDayCheckIn(participantId, day);
        }

        setManualInput("");
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
    };

    const handleEventTypeChange = (type: "single" | "multi") => {
        stopCamera();
        setEventType(type);
        setSelectedDay("");
        setLastScannedCode("");
        setManualInput("");
    };

    const handleBackToEventSelection = () => {
        stopCamera();
        setEventType(null);
        setSelectedDay("");
        setLastScannedCode("");
        setManualInput("");
        setCustomDay("");
        setShowCustomInput(false);
    };

    // Event Type Selection Screen
    if (!eventType) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <QrCode className="w-8 h-8 text-white" />
                            <h1 className="text-2xl font-bold text-white">Event Check-in</h1>
                        </div>
                        <p className="text-center text-purple-100">Select your event type</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <p className="text-center text-gray-600 mb-6">
                            What type of event are you checking in for?
                        </p>

                        {/* Single Day Event Button */}
                        <button
                            onClick={() => handleEventTypeChange("single")}
                            className="w-full bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl p-6 transition-all duration-200 flex items-center gap-4 group"
                        >
                            <div className="bg-purple-100 group-hover:bg-purple-200 rounded-full p-4 transition-colors">
                                <Calendar className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Single Day Event</h3>
                                <p className="text-sm text-gray-600">One-time check-in for a single day event</p>
                            </div>
                        </button>

                        {/* Multi Day Event Button */}
                        <button
                            onClick={() => handleEventTypeChange("multi")}
                            className="w-full bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-6 transition-all duration-200 flex items-center gap-4 group"
                        >
                            <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-4 transition-colors">
                                <CalendarDays className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Multi-Day Event</h3>
                                <p className="text-sm text-gray-600">Select a specific day for check-in</p>
                            </div>
                        </button>

                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs mt-6">
                            <p className="text-blue-800">
                                <strong>Note:</strong> For multi-day events, you'll need to select which day you're attending before scanning.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // QR Scanner Screen
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        {eventType === "single" ? (
                            <Calendar className="w-8 h-8 text-white" />
                        ) : (
                            <CalendarDays className="w-8 h-8 text-white" />
                        )}
                        <h1 className="text-2xl font-bold text-white">
                            {eventType === "single" ? "Single Day" : "Multi-Day"} Check-in
                        </h1>
                    </div>
                    <p className="text-center text-purple-100">Scan your registration QR code</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Multi-day Day Selection */}
                    {eventType === "multi" && (
                        <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-blue-900">
                                    Select Day (Required)
                                </label>
                                <button
                                    onClick={() => setShowCustomInput(!showCustomInput)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                >
                                    {showCustomInput ? "Show Quick Select" : "Custom Day"}
                                </button>
                            </div>

                            {!showCustomInput ? (
                                <>
                                    <div className="grid grid-cols-5 gap-2">
                                        {Array.from({ length: Math.min(maxDay, 15) }, (_, i) => i + 1).map((day) => (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    console.log("Day clicked:", day);
                                                    setSelectedDay(day.toString());
                                                    setCustomDay("");
                                                }}
                                                className={`py-2 px-3 rounded-lg font-semibold transition-all text-sm ${selectedDay === day.toString()
                                                        ? "bg-blue-600 text-white shadow-lg scale-105"
                                                        : "bg-white text-gray-900 hover:bg-blue-100 border border-blue-300"
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                    {maxDay > 15 && (
                                        <p className="text-xs text-blue-700">
                                            More than 15 days? Click "Custom Day" above to enter manually.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={customDay}
                                        onChange={(e) => setCustomDay(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter" && customDay) {
                                                const day = parseInt(customDay, 10);
                                                if (day > 0) {
                                                    setSelectedDay(day.toString());
                                                    setShowCustomInput(false);
                                                }
                                            }
                                        }}
                                        placeholder="Enter day number (e.g., 25)"
                                        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            const day = parseInt(customDay, 10);
                                            if (day > 0) {
                                                setSelectedDay(day.toString());
                                                setShowCustomInput(false);
                                            } else {
                                                toastService.warning("Please enter a valid day number");
                                            }
                                        }}
                                        disabled={!customDay || parseInt(customDay, 10) < 1}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                    >
                                        Set Day {customDay || ""}
                                    </button>
                                </div>
                            )}

                            {selectedDay && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-sm font-semibold text-green-800 text-center">
                                        ✓ Scanning for Day {selectedDay}
                                    </p>
                                </div>
                            )}

                            {!selectedDay && (
                                <p className="text-xs text-blue-700">
                                    ⚠️ Please select a day before scanning
                                </p>
                            )}
                        </div>
                    )}

                    {/* Camera View */}
                    <div className="bg-black rounded-xl overflow-hidden aspect-square border-4 border-purple-200 relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            webkit-playsinline="true"
                            muted
                            className="w-full h-full object-cover"
                            style={{ width: '100%', height: '100%' }}
                        />
                        {/* Scanning guide overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                        </div>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanning Status */}
                    {isScanning && (
                        <div className="flex items-center justify-center gap-2 text-purple-600 bg-purple-50 px-4 py-3 rounded-lg border border-purple-200">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">
                                {eventType === "multi" && !selectedDay
                                    ? "Select a day to start scanning"
                                    : "Scanning for QR code..."}
                            </span>
                        </div>
                    )}

                    {!isScanning && (
                        <button
                            onClick={resumeScanning}
                            disabled={eventType === "multi" && !selectedDay}
                            className="w-full flex items-center justify-center gap-2 text-purple-600 bg-purple-50 px-4 py-3 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Resume Scanning
                        </button>
                    )}

                    {/* Manual Input */}
                    <div className="space-y-3 border-t pt-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Or enter participant ID manually
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        handleManualCheckIn();
                                    }
                                }}
                                placeholder="Participant ID"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleManualCheckIn}
                                disabled={isLoading || !manualInput.trim() || (eventType === "multi" && !selectedDay)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 text-sm"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Submit"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Change Event Type */}
                    <button
                        onClick={handleBackToEventSelection}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Change Event Type
                    </button>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs">
                        <p className="text-blue-800">
                            <strong>Tip:</strong> Keep the QR code steady in frame.
                            {eventType === "multi" && " Don't forget to select the day first!"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}