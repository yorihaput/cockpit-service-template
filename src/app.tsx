/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Copyright (C) 2017 Red Hat, Inc.
 */

import React, { useState } from 'react';
import { Tabs, Tab, TabTitleText } from "@patternfly/react-core/dist/esm/components/Tabs/index.js";
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Logs } from './pages/Logs';
import { ConfigEditor } from './pages/ConfigEditor';

import './app.scss';

export const Application = () => {
    const [activeTabKey, setActiveTabKey] = useState<string | number>(0);

    const handleTabClick = (
        event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
        tabIndex: string | number
    ) => {
        setActiveTabKey(tabIndex);
    };

    return (
        <React.Fragment>
            <Tabs activeKey={activeTabKey} onSelect={handleTabClick} isBox>
                <Tab eventKey={0} title={<TabTitleText>Dashboard</TabTitleText>}>
                    <Dashboard />
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>Logs</TabTitleText>}>
                    <Logs />
                </Tab>
                <Tab eventKey={2} title={<TabTitleText>Config Editor</TabTitleText>}>
                    <ConfigEditor />
                </Tab>
                <Tab eventKey={3} title={<TabTitleText>Settings</TabTitleText>}>
                    <Settings />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};
