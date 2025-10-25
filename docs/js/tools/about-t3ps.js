// About T3PS tool module

export function getHTML() {
  return `
    <div class="about-container">
      <div class="about-content">
        <h1>About T3PS</h1>
        <h2>Tetrahydrofuran with 3' Phosphate and Capping Sugar</h2>

        <section class="about-section">
          <h3>Overview</h3>
          <p>
            T3PS is a computational model compound designed to investigate the intrinsic mechanical
            properties of the phosphodiester backbone in DNA. The model contains a phosphodiester
            linkage capped by furanose rings, allowing systematic exploration of conformational space
            relevant to the A, B<sub>I</sub>, and B<sub>II</sub> canonical forms of duplex DNA.
          </p>
          <p>
            By omitting nucleic acid bases and second phosphate moieties, T3PS isolates the intrinsic
            conformational preferences of the phosphodiester backbone, independent of base composition
            and intrastrand phosphate-phosphate repulsion effects.
          </p>
        </section>

        <section class="about-section">
          <h3>Scientific Background</h3>
          <p>
            Canonical forms of duplex DNA sample well-defined regions of the α, β, γ, ε, and ζ
            dihedral angles that define the phosphodiester linkage conformation. Understanding
            the intrinsic contribution of these five degrees of freedom to DNA conformational
            properties has remained challenging.
          </p>

          <div class="diagram-container">
            <img src="assets/t3ps_diagram.jpeg" alt="T3PS model compound structure" />
            <p class="caption">
              Figure 1. T3PS model compound showing the five backbone dihedral angles (α, β, γ, ε, ζ)
              sampled in conformational analysis
            </p>
          </div>
        </section>

        <section class="about-section">
          <h3>Dihedral Angle Definitions</h3>
          <p>
            The T3PS model allows measurement of 15 dihedral angles: 5 backbone torsions,
            5 pseudorotation angles for the 5' sugar ring, and 5 for the 3' sugar ring.
          </p>

          <h4>Backbone Dihedral Angles</h4>
          <table class="dihedral-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Atom Indices</th>
                <th>CHARMM Atom Names</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ε</strong></td>
                <td>epsilon</td>
                <td>4, 10, 12, 13</td>
                <td>C4'1 – C3'1 – O3'1 – P</td>
              </tr>
              <tr>
                <td><strong>ζ</strong></td>
                <td>zeta</td>
                <td>10, 12, 13, 16</td>
                <td>C3'1 – O3'1 – P – O5'2</td>
              </tr>
              <tr>
                <td><strong>α</strong></td>
                <td>alpha</td>
                <td>12, 13, 16, 17</td>
                <td>O3'1 – P – O5'2 – C5'2</td>
              </tr>
              <tr>
                <td><strong>β</strong></td>
                <td>beta</td>
                <td>13, 16, 17, 20</td>
                <td>P – O5'2 – C5'2 – C4'2</td>
              </tr>
              <tr>
                <td><strong>γ</strong></td>
                <td>gamma</td>
                <td>16, 17, 20, 29</td>
                <td>O5'2 – C5'2 – C4'2 – C3'2</td>
              </tr>
            </tbody>
          </table>

          <h4>Sugar 1 Pseudorotation Angles (5' Ring)</h4>
          <table class="dihedral-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Atom Indices</th>
                <th>CHARMM Atom Names</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ν<sub>0</sub></strong></td>
                <td>nu0</td>
                <td>4, 0, 1, 7</td>
                <td>C4'1 – O4'1 – C1'1 – C2'1</td>
              </tr>
              <tr>
                <td><strong>ν<sub>1</sub></strong></td>
                <td>nu1</td>
                <td>0, 1, 7, 10</td>
                <td>O4'1 – C1'1 – C2'1 – C3'1</td>
              </tr>
              <tr>
                <td><strong>ν<sub>2</sub></strong></td>
                <td>nu2</td>
                <td>1, 7, 10, 4</td>
                <td>C1'1 – C2'1 – C3'1 – C4'1</td>
              </tr>
              <tr>
                <td><strong>ν<sub>3</sub></strong></td>
                <td>nu3</td>
                <td>7, 10, 4, 0</td>
                <td>C2'1 – C3'1 – C4'1 – O4'1</td>
              </tr>
              <tr>
                <td><strong>ν<sub>4</sub></strong></td>
                <td>nu4</td>
                <td>10, 4, 0, 1</td>
                <td>C3'1 – C4'1 – O4'1 – C1'1</td>
              </tr>
            </tbody>
          </table>

          <h4>Sugar 2 Pseudorotation Angles (3' Ring)</h4>
          <table class="dihedral-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Atom Indices</th>
                <th>CHARMM Atom Names</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>μ<sub>0</sub></strong></td>
                <td>mu0</td>
                <td>20, 22, 23, 26</td>
                <td>C4'2 – O4'2 – C1'2 – C2'2</td>
              </tr>
              <tr>
                <td><strong>μ<sub>1</sub></strong></td>
                <td>mu1</td>
                <td>22, 23, 26, 29</td>
                <td>O4'2 – C1'2 – C2'2 – C3'2</td>
              </tr>
              <tr>
                <td><strong>μ<sub>2</sub></strong></td>
                <td>mu2</td>
                <td>23, 26, 29, 20</td>
                <td>C1'2 – C2'2 – C3'2 – C4'2</td>
              </tr>
              <tr>
                <td><strong>μ<sub>3</sub></strong></td>
                <td>mu3</td>
                <td>26, 29, 20, 22</td>
                <td>C2'2 – C3'2 – C4'2 – O4'2</td>
              </tr>
              <tr>
                <td><strong>μ<sub>4</sub></strong></td>
                <td>mu4</td>
                <td>29, 20, 22, 23</td>
                <td>C3'2 – C4'2 – O4'2 – C1'2</td>
              </tr>
            </tbody>
          </table>

          <p class="note">
            <strong>Note:</strong> Atom indices are 0-based as used by 3Dmol.js. Use the XYZ Structure Viewer
            tool to interactively select and measure any of these dihedral angles.
          </p>
        </section>

        <section class="about-section">
          <h3>Methodology</h3>
          <p>
            <strong>Quantum Mechanical Calculations:</strong> Ab initio QM calculations at the
            MP2/6-31+G(d) level were performed to systematically sample potential energy surfaces
            of the five backbone dihedral angles.
          </p>
          <p>
            <strong>Constraint Protocol:</strong> Initial optimizations constrained non-target
            dihedrals and sugar puckers to values characteristic of A-form (C3'-endo) or B-form
            (C2'-endo) DNA, followed by full relaxation to determine minimum energy conformations.
          </p>
          <p>
            <strong>Energy Refinement:</strong> Single-point energy calculations using larger
            basis sets (aug-cc-pVTZ) with complete basis set (CBS) extrapolation provided
            accurate relative energies for different DNA conformational states.
          </p>
        </section>

        <section class="about-section">
          <h3>Key Findings</h3>
          <ul>
            <li><strong>B<sub>I</sub> Form Stability:</strong> The B<sub>I</sub> conformation is
            intrinsically favored over A and B<sub>II</sub> forms by at least 1.6 and 0.8 kcal/mol,
            respectively, consistent with experimental observations under high water activity</li>

            <li><strong>Energy Surface Correlation:</strong> Low energy regions of QM potential
            energy surfaces show strong correspondence with high-probability regions in
            crystallographic surveys, validating the T3PS model</li>

            <li><strong>Subtle Conformational Features:</strong> Features of the energy surfaces
            mirror subtle aspects of crystallographic probability distributions, suggesting
            significant contribution of backbone intrinsic properties to DNA structure</li>

            <li><strong>Single-Stranded DNA Prediction:</strong> The correlation between QM
            surfaces and duplex DNA sampling suggests single-stranded DNA preferentially adopts
            folded, duplex-like conformations, potentially lowering the entropic barrier to
            duplex formation</li>

            <li><strong>Environmental Contributions:</strong> The intrinsically unfavorable nature
            of A and B<sub>II</sub> forms emphasizes the importance of environmental factors
            (hydration, base stacking, protein interactions) in stabilizing these conformations</li>
          </ul>
        </section>

        <section class="about-section">
          <h3>Applications</h3>
          <ul>
            <li>Understanding DNA conformational equilibria and transitions</li>
            <li>Force field development and validation for nucleic acid simulations</li>
            <li>Predicting sequence-dependent DNA structural preferences</li>
            <li>Interpreting protein-DNA recognition mechanisms</li>
            <li>Analyzing single-stranded DNA structure and dynamics</li>
          </ul>
        </section>

        <section class="about-section">
          <h3>Significance</h3>
          <p>
            T3PS calculations demonstrate that the phosphodiester backbone makes a quantitative,
            significant contribution to DNA conformational properties. While environmental factors
            and base composition are crucial, the intrinsic mechanical properties of the backbone
            provide a fundamental energetic foundation that influences DNA structure in both
            crystalline and solution states.
          </p>
          <p>
            This work represents an important step toward comprehensive understanding of the
            energetic determinants governing DNA structure and function, with implications for
            fields ranging from structural biology to drug design.
          </p>
        </section>

        <section class="about-section">
          <h3>Reference</h3>
          <p class="citation">
            MacKerell, Jr A D. <em>Contribution of the intrinsic mechanical energy of the
            phosphodiester linkage to the relative stability of the A, B<sub>I</sub>, and
            B<sub>II</sub> forms of duplex DNA.</em> The Journal of Physical Chemistry B,
            2009, 113(10): 3235-3244.
          </p>
          <p class="citation-link">
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2784611/" target="_blank">
              Read full article →
            </a>
          </p>
        </section>
      </div>
    </div>
  `;
}

export function init() {
  // No initialization needed
}
