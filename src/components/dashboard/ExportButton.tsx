'use client';

import { useState } from 'react';
import type { AnalysisReport } from '@/lib/analysis/types';
import { Download, FileJson, FileText, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ExportButton({ report }: { report: AnalysisReport }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleExportJSON = () => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentforce-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Helper function to add text with auto page break
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false, indent: number = 0) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');

      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin - indent);

      for (const line of lines) {
        if (yPos > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(line, margin + indent, yPos);
        yPos += fontSize * 0.5;
      }
      yPos += 3;
    };

    // Header
    pdf.setFillColor(37, 99, 235); // blue-600
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Agentforce Agent Review Toolkit', margin, 20);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('by Ajay Kumar Kambadkone Suresh', margin, 30);

    yPos = 50;
    pdf.setTextColor(0, 0, 0);

    // Report metadata (from first agent if available)
    const meta = report.agents[0];
    addText(`Generated: ${new Date().toLocaleString()}`, 9, false);
    addText(`Organization ID: ${meta?.orgId ?? '—'}`, 9, false);
    addText(`API Version: ${meta?.apiVersion ?? '—'}`, 9, false);
    yPos += 5;

    // For each agent
    report.agents.forEach((agent, agentIdx) => {
      if (agentIdx > 0) {
        pdf.addPage();
        yPos = margin;
      }

      // Agent header
      pdf.setFillColor(243, 244, 246); // gray-100
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F');
      pdf.setTextColor(17, 24, 39); // gray-900
      addText(`Agent: ${agent.agentName}`, 14, true);
      addText(`Developer Name: ${agent.agentDeveloperName}`, 9, false);
      yPos += 3;

      // Overall Score
      addText('Overall Score', 12, true);
      addText(`Score: ${agent.overallScore}/100 (Grade: ${agent.overallGrade})`, 10, false);

      if (agent.stageScores) {
        addText(`Design & Setup: ${agent.stageScores.designSetup}/100`, 9, false, 5);
        addText(`Configuration: ${agent.stageScores.configuration}/100`, 9, false, 5);
        addText(`Test: ${agent.stageScores.test}/100`, 9, false, 5);
        addText(`Deploy: ${agent.stageScores.deploy}/100`, 9, false, 5);
        addText(`Monitor: ${agent.stageScores.monitor}/100`, 9, false, 5);
        addText(`Data: ${agent.stageScores.data}/100`, 9, false, 5);
        if (agent.stageScores.apex != null) {
          addText(`Apex: ${agent.stageScores.apex}/100`, 9, false, 5);
        }
      }
      yPos += 5;

      // Dimensional Scores
      if (agent.dimensionalScores) {
        addText('Quality Dimensions', 12, true);
        Object.entries(agent.dimensionalScores).forEach(([dimension, score]) => {
          addText(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)}: ${score.toFixed(1)}/100`, 9, false, 5);
        });
        yPos += 5;
      }

      // Findings Summary
      const criticalCount = agent.findings.filter(f => f.severity === 'critical').length;
      const warningCount = agent.findings.filter(f => f.severity === 'warning').length;
      const infoCount = agent.findings.filter(f => f.severity === 'info').length;

      addText('Findings Summary', 12, true);
      addText(`Critical: ${criticalCount} | Warnings: ${warningCount} | Info: ${infoCount}`, 10, false);
      yPos += 5;

      // Detailed Findings
      if (agent.findings.length > 0) {
        addText('Detailed Findings', 12, true);

        agent.findings.forEach((finding, idx) => {
          if (yPos > pageHeight - 60) {
            pdf.addPage();
            yPos = margin;
          }

          // Severity color
          pdf.setFillColor(
            finding.severity === 'critical' ? 239 : finding.severity === 'warning' ? 254 : 220,
            finding.severity === 'critical' ? 68 : finding.severity === 'warning' ? 240 : 252,
            finding.severity === 'critical' ? 68 : finding.severity === 'warning' ? 138 : 231
          );
          pdf.rect(margin, yPos - 3, 3, 6, 'F');

          addText(`${idx + 1}. ${finding.title}`, 10, true, 8);
          addText(`Severity: ${finding.severity.toUpperCase()} | Category: ${finding.category} | Stage: ${finding.stage}`, 8, false, 8);
          addText(`Component: ${finding.affectedComponent}`, 8, false, 8);
          addText(`Description: ${finding.description}`, 9, false, 8);
          addText(`Recommendation: ${finding.recommendation}`, 9, false, 8);
          yPos += 3;
        });
      }
    });

    // Footer on last page
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    pdf.save(`agentforce-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
            >
              <FileJson className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-medium">Export as JSON</div>
                <div className="text-xs text-gray-500">Raw data format</div>
              </div>
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left border-t border-gray-100"
            >
              <FileText className="w-4 h-4 text-red-600" />
              <div>
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-gray-500">Formatted report</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
